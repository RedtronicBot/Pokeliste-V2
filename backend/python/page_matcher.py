import sys
import json
import cv2
import numpy as np
import base64
import os

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
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY)
    kernel = np.ones((20, 20), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    h_img, w_img = img.shape[:2]
    min_area = (w_img * h_img) * 0.3
    large_contours = [c for c in contours if cv2.contourArea(c) > min_area]
    largest = max(large_contours if large_contours else contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)
    print(f"Zone détectée: x={x}, y={y}, w={w}, h={h}", file=sys.stderr)
    print(f"Taille image: {w_img}x{h_img}", file=sys.stderr)
    return x, y, w, h

def extract_cards(img):
    zone = detect_binder_zone(img)
    if zone:
        x, y, w, h = zone
        margin = 10
        binder = img[y+margin:y+h-margin, x+margin:x+w-margin]
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
            card = binder[y1+inner_margin:y2-inner_margin, x1+inner_margin:x2-inner_margin]
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
    gray = preprocess(card_img)
    kp_query, desc_query = orb.detectAndCompute(gray, None)
    if desc_query is None:
        return None

    results = []
    for card_id, desc_ref in ref_descriptors.items():
        matches = bf.knnMatch(desc_query, desc_ref, k=2)
        good_matches = [m for m, n in matches if m.distance < 0.75 * n.distance]
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