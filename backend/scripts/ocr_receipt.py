# backend/scripts/ocr_receipt.py
import sys, json, re, os
from PIL import Image
import pytesseract
from dateutil import parser as dateparser

# If Tesseract isn't on PATH, tell Python where it is:
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

AMOUNT_RE = re.compile(r'(?<!\d)(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})|\d+\.\d{2})(?!\d)', re.IGNORECASE)
DATE_CANDIDATES = [
    r'\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b',     # 2025-10-19
    r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b',   # 10/19/2025, 19/10/25
    r'\b[A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}\b' # October 19, 2025
]
DATE_RE = re.compile('|'.join(DATE_CANDIDATES))

def clean_amount(a):
    a = a.replace(',', '').replace(' ', '')
    try:
        return float(a)
    except:
        return None

def parse_total_by_keyword(lines):
    KEYWORDS = ('TOTAL', 'AMOUNT DUE', 'BALANCE DUE', 'PAID', 'NET TOTAL')
    best = None
    for ln in lines:
        up = ln.upper()
        if any(k in up for k in KEYWORDS):
            amounts = [clean_amount(m) for m in AMOUNT_RE.findall(ln)]
            amounts = [x for x in amounts if x]
            if amounts:
                cand = amounts[-1]
                if best is None or cand > best:
                    best = cand
    return best

def extract(text):
    amounts = [clean_amount(m) for m in AMOUNT_RE.findall(text)]
    amounts = [x for x in amounts if x is not None and x > 0]
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    merchant = None
    for ln in lines[:8]:
        if not AMOUNT_RE.search(ln) and len(ln) > 2:
            merchant = ln
            break

    dmatch = DATE_RE.search(text)
    rec_date = None
    if dmatch:
        try:
            rec_date = dateparser.parse(dmatch.group(0), dayfirst=False, fuzzy=True).date().isoformat()
        except:
            rec_date = None

    keyword_total = parse_total_by_keyword(lines)
    likely_total = keyword_total if keyword_total is not None else (max(amounts) if amounts else None)

    return {
        "merchant": merchant,
        "date": rec_date,
        "amounts": amounts,
        "likely_total": likely_total
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "No image path"}))
        return
    path = sys.argv[1]
    if not os.path.exists(path):
        print(json.dumps({"ok": False, "error": "File not found", "path": path}))
        return

    try:
        img = Image.open(path)
        text = pytesseract.image_to_string(img)
    except Exception as e:
        print(json.dumps({"ok": False, "error": f"OCR failed: {e}"}))
        return

    data = extract(text)
    data["raw_text_preview"] = text[:800]
    print(json.dumps({"ok": True, "data": data}))

if __name__ == "__main__":
    main()
