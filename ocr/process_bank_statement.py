from typing import Dict

from ocr.clean_text import clean_text
from ocr.ocr_engine import extract_text
from ocr.parser import parse_transactions
from ocr.pdf_to_image import pdf_to_images
from ocr.preprocess import preprocess_image
from ocr.summary import calculate_summary


def processBankStatement(pdfPath: str) -> Dict[str, object]:
    images = pdf_to_images(pdfPath)

    raw_text = ""
    for image in images:
        processed_image = preprocess_image(image)
        raw_text += extract_text(processed_image) + "\n"

    cleaned_text = clean_text(raw_text)
    transactions = parse_transactions(cleaned_text)

    return {
        "transactions": transactions,
        "summary": calculate_summary(transactions),
    }
