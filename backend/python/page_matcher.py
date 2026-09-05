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


def detect_binder_zone(img):
    """Détecte la zone globale de la page du classeur (seuillage Otsu, robuste
    à l'éclairage — contrairement à un seuil fixe qui casse dès que le fond
    n'est pas très sombre).

    On segmente la PAGE ENTIÈRE plutôt que chaque carte individuellement :
    le contraste page-claire / classeur-noir est fiable, alors que segmenter
    carte par carte casse dès qu'une carte a une illustration sombre à
    l'intérieur (le seuillage la confond avec le fond). Une fois la page
    localisée, une simple division en grille fixe suffit — voir extract_cards.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (7, 7), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if np.sum(thresh == 255) / thresh.size > 0.6:
        thresh = cv2.bitwise_not(thresh)

    h_img, w_img = img.shape[:2]
    img_area = h_img * w_img
    scale = w_img / 1000
    kernel = np.ones((max(1, int(20 * scale)),) * 2, np.uint8)
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    large_contours = [c for c in contours if cv2.contourArea(c) > img_area * 0.3]
    if not large_contours:
        return None

    # Une page 3x3 de cartes a sensiblement le même ratio l/h qu'une carte seule.
    # Si plusieurs candidats, on privilégie celui dont le ratio colle le mieux,
    # ce qui évite d'attraper un objet parasite (ex: table, clavier) fusionné
    # avec la page par le closing morphologique.
    def ratio_score(c):
        x, y, w, h = cv2.boundingRect(c)
        r = min(w, h) / max(w, h) if w and h else 0
        return abs(r - CARD_ASPECT_RATIO)

    best = min(large_contours, key=ratio_score)
    x, y, w, h = cv2.boundingRect(best)
    print(f"Zone détectée: x={x}, y={y}, w={w}, h={h} (image: {w_img}x{h_img})", file=sys.stderr)
    return x, y, w, h


def extract_cards(img):
    """Découpe la photo en 9 cartes : localise la page du classeur, puis
    divise en grille fixe 3x3. Volontairement simple — segmenter chaque
    carte individuellement par sa luminosité s'est avéré peu fiable dès
    qu'une carte a une illustration sombre (voir detect_binder_zone)."""
    zone = detect_binder_zone(img)
    if zone:
        x, y, w, h = zone
        margin = 10
        binder = img[y + margin:y + h - margin, x + margin:x + w - margin]
    else:
        print("Aucune zone détectée, utilisation de l'image entière", file=sys.stderr)
        binder = img

    h, w = binder.shape[:2]
    card_h, card_w = h // 3, w // 3
    cards = []
    for row in range(3):
        for col in range(3):
            y1, y2 = row * card_h, (row + 1) * card_h
            x1, x2 = col * card_w, (col + 1) * card_w
            inner_margin = 8
            cards.append(binder[y1 + inner_margin:y2 - inner_margin, x1 + inner_margin:x2 - inner_margin])
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
