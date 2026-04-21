from pathlib import Path
from typing import Dict

from PIL import Image

from ml.anomaly_detector import detect_anomalies
from ml.insights_generator import generate_insights
from ocr.clean_text import clean_text
from ocr.ocr_engine import extract_text
from ocr.pdf_to_image import pdf_to_images
from ocr.preprocess import preprocess_image
from ocr.summary import calculate_summary
from parser.transaction_parser import parse_transactions


class BankStatementProcessingError(Exception):
    pass


def _load_input_images(path: Path):
    suffix = path.suffix.lower()
    image_extensions = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}

    if suffix in image_extensions:
        with Image.open(path) as image:
            return [image.convert("RGB")]

    return pdf_to_images(str(path))


def process_bank_statement(pdf_path: str) -> Dict[str, object]:
    path = Path(pdf_path)
    if not path.exists():
        raise BankStatementProcessingError("Uploaded file could not be found")

    try:
        images = _load_input_images(path)

        raw_text_parts = []
        for image in images:
            processed_image = preprocess_image(image)
            raw_text_parts.append(extract_text(processed_image).strip())

        raw_text = "\n".join(part for part in raw_text_parts if part)
        cleaned_text = clean_text(raw_text)
        transactions = parse_transactions(cleaned_text)
        transactions = detect_anomalies(transactions)

        return {
            "raw_text": raw_text,
            "cleaned_text": cleaned_text,
            "transactions": transactions,
            "summary": calculate_summary(transactions),
            "insights": generate_insights(transactions),
        }
    except Exception as error:
        raise BankStatementProcessingError(str(error) or "Failed to process bank statement")
