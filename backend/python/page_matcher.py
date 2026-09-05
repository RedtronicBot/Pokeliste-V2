import sys
import json
import cv2
import numpy as np
import base64
import os

CARD_ASPECT_RATIO = 2.5 / 3.5
ASPECT_TOLERANCE = 0.35
MIN_CARD_AREA_RATIO = 0.02
MAX_CARD_AREA_RATIO = 0.5


def load_image_from_base64(b64_string):
    img_data = base64.b64decode(b64_string)
    arr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def preprocess(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    return gray


def order_points_grid(rects):
    """Trie les rectangles détectés en grille : ligne par ligne, gauche à droite."""
    rects = sorted(rects, key=lambda r: r[1])
    rows = []
    current_row = [rects[0]]
    row_y = rects[0][1]
    for r in rects[1:]:
        if abs(r[1] - row_y) < r[3] * 0.5:
            current_row.append(r)
        else:
            rows.append(current_row)
            current_row = [r]
            row_y = r[1]
    rows.append(current_row)
    ordered = []
    for row in rows:
        row_sorted = sorted(row, key=lambda r: r[0])
        ordered.extend(row_sorted)
    return ordered


def detect_cards_by_contour(img):
    """Détecte chaque carte individuellement via ses contours, au lieu de découper
    une grille fixe sur toute l'image. Plus robuste au cadrage et à l'éclairage
    qu'un seuil fixe + division 3x3 aveugle."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # Seuillage automatique (Otsu) : s'adapte à la luminosité de la photo,
    # contrairement à un seuil fixe qui casse dès que le fond n'est pas très sombre.
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Otsu peut inverser fond/forme selon les cas : on corrige si la majorité
    # de l'image ressort "blanche" (probablement le fond, pas les cartes).
    white_ratio = np.sum(thresh == 255) / thresh.size
    if white_ratio > 0.6:
        thresh = cv2.bitwise_not(thresh)

    kernel = np.ones((15, 15), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    h_img, w_img = img.shape[:2]
    img_area = h_img * w_img
    candidates = []

    for c in contours:
        area = cv2.contourArea(c)
        if area < img_area * MIN_CARD_AREA_RATIO or area > img_area * MAX_CARD_AREA_RATIO:
            continue
        x, y, w, h = cv2.boundingRect(c)
        if h == 0:
            continue
        ratio = w / h
        # accepte l'orientation portrait ET paysage d'une carte à jouer
        if not (abs(ratio - CARD_ASPECT_RATIO) < ASPECT_TOLERANCE or
                abs(ratio - 1 / CARD_ASPECT_RATIO) < ASPECT_TOLERANCE):
            continue
        candidates.append((x, y, w, h))

    print(f"Contours candidats retenus: {len(candidates)}", file=sys.stderr)
    return candidates


def detect_binder_zone(img):
    """Repli : détecte la zone globale du classeur (seuillage Otsu, plus fiable
    qu'un seuil fixe à 50)."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    kernel = np.ones((20, 20), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    h_img, w_img = img.shape[:2]
    min_area = (w_img * h_img) * 0.3
    large_contours = [c for c in contours if cv2.contourArea(c) > min_area]
    if not large_contours:
        return None
    largest = max(large_contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)
    print(f"Zone détectée: x={x}, y={y}, w={w}, h={h}", file=sys.stderr)
    print(f"Taille image: {w_img}x{h_img}", file=sys.stderr)
    return x, y, w, h


def extract_cards(img):
    boxes = detect_cards_by_contour(img)

    if len(boxes) >= 4:
        # Assez de cartes détectées individuellement : on s'y fie plutôt qu'à une grille aveugle.
        ordered = order_points_grid(boxes)
        cards = []
        for x, y, w, h in ordered:
            m = int(min(w, h) * 0.03)
            cards.append(img[y + m:y + h - m, x + m:x + w - m])
        return cards

    # Repli : détection individuelle insuffisante -> ancienne méthode par grille fixe,
    # mais avec un seuillage Otsu au lieu du seuil fixe à 50.
    print("Détection individuelle insuffisante, repli sur grille fixe", file=sys.stderr)
    zone = detect_binder_zone(img)
    if zone:
        x, y, w, h = zone
        margin = 10
        binder = img[y + margin:y + h - margin, x + margin:x + w - margin]
    else:
        binder = img
    h, w = binder.shape[:2]
    card_h = h // 3
    card_w = w // 3
    cards = []
    for row in range(3):
        for col in range(3):
            y1 = row * card_h
            y2 = (row + 1) * card_h
            x1 = col * card_w
            x2 = (col + 1) * card_w
            inner_margin = 8
            card = binder[y1 + inner_margin:y2 - inner_margin, x1 + inner_margin:x2 - inner_margin]
            cards.append(card)
    return cards


def load_reference_descriptors(images_dir, orb):
    descriptors = {}
    for filename in os.listdir(images_dir):
        if not filename.endswith((".jpg", ".png", ".webp")):
            continue
        card_id = os.path.splitext(filename)[0]
        ref_img = cv2.imread(os.path.join(images_dir, filename), cv2.IMREAD_GRAYSCALE)
        if ref_img is None:
            continue
        ref_img = cv2.equalizeHist(ref_img)
        ref_img = cv2.GaussianBlur(ref_img, (3, 3), 0)
        _, desc = orb.detectAndCompute(ref_img, None)
        if desc is not None:
            descriptors[card_id] = desc
    return descriptors


def compute_confidence(results):
    if not results:
        return "low"
    if len(results) == 1:
        # Pas de second résultat pour comparer — confiance medium par défaut
        return "medium"

    best_count = -results[0]["score"]
    second_count = -results[1]["score"]
    ratio = best_count / second_count if second_count > 0 else 999

    if ratio > 1.5:
        return "high"
    elif ratio > 1.2:
        return "medium"
    else:
        return "low"


def match_single_card(card_img, ref_descriptors, orb, bf):
    if card_img is None or card_img.size == 0:
        return None

    gray = preprocess(card_img)
    kp_query, desc_query = orb.detectAndCompute(gray, None)
    if desc_query is None:
        return None

    results = []
    for card_id, desc_ref in ref_descriptors.items():
        if desc_ref is None or len(desc_ref) < 2:
            # knnMatch avec k=2 plante si la référence a moins de 2 descripteurs
            continue
        try:
            matches = bf.knnMatch(desc_query, desc_ref, k=2)
        except cv2.error:
            continue
        good_matches = []
        for pair in matches:
            if len(pair) < 2:
                continue
            m, n = pair
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)
        if good_matches:
            results.append({"cardId": card_id, "score": -len(good_matches)})

    if not results:
        return None

    results.sort(key=lambda x: x["score"])
    best = results[0]
    good_count = -best["score"]

    return {
        "cardId": best["cardId"],
        "goodMatches": good_count,
        "confidence": compute_confidence(results)
    }


def match_page(query_b64, images_dir):
    img = load_image_from_base64(query_b64)
    if img is None:
        return {"error": "Image invalide"}

    cards = extract_cards(img)

    orb = cv2.ORB_create(nfeatures=1000)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING)

    ref_descriptors = load_reference_descriptors(images_dir, orb)
    print(f"Descripteurs chargés: {len(ref_descriptors)} cartes", file=sys.stderr)

    results = []
    for i, card_img in enumerate(cards):
        match = match_single_card(card_img, ref_descriptors, orb, bf)
        results.append({"position": i + 1, "match": match})

    return {"cards": results}


if __name__ == "__main__":
    tmp_file = sys.argv[1]
    images_dir = sys.argv[2]
    with open(tmp_file, "r") as f:
        query_b64 = f.read().strip()
    print(json.dumps(match_page(query_b64, images_dir)))