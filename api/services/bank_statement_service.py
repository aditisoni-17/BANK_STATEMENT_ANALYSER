import os
import time
from pathlib import Path
from typing import Dict

from pytesseract import TesseractError

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


OCR_TIMEOUT_SECONDS = float(os.getenv("OCR_TIMEOUT_SECONDS", "90"))
OCR_MAX_RETRIES = int(os.getenv("OCR_MAX_RETRIES", "3"))
OCR_RETRY_BACKOFF_SECONDS = float(os.getenv("OCR_RETRY_BACKOFF_SECONDS", "1"))


def _load_input_images(path: Path):
    return pdf_to_images(str(path))


def _ocr_page(image, page_index: int) -> str:
    last_error = None

    for attempt in range(1, OCR_MAX_RETRIES + 1):
        try:
            processed_image = preprocess_image(image)
            return extract_text(processed_image, timeout_seconds=OCR_TIMEOUT_SECONDS).strip()
        except RuntimeError as error:
            last_error = error
        except TesseractError as error:
            last_error = error
        except Exception as error:
            last_error = error

        if attempt < OCR_MAX_RETRIES:
            time.sleep(OCR_RETRY_BACKOFF_SECONDS * attempt)

    raise BankStatementProcessingError(
        f"OCR failed on page {page_index + 1}: {last_error or 'unknown error'}"
    )


def process_bank_statement(pdf_path: str) -> Dict[str, object]:
    path = Path(pdf_path)
    if not path.exists():
        raise BankStatementProcessingError("Uploaded file could not be found")

    try:
        images = _load_input_images(path)

        raw_text_parts = []
        for index, image in enumerate(images):
            raw_text_parts.append(_ocr_page(image, index))

        raw_text = "\n".join(part for part in raw_text_parts if part)
        cleaned_text = clean_text(raw_text)
        try:
            transactions = parse_transactions(cleaned_text)
        except Exception as error:
            raise BankStatementProcessingError(f"Parsing failed: {error}") from error

        try:
            transactions = detect_anomalies(transactions)
        except Exception as error:
            raise BankStatementProcessingError(f"Anomaly detection failed: {error}") from error

        return {
            "raw_text": raw_text,
            "cleaned_text": cleaned_text,
            "transactions": transactions,
            "summary": calculate_summary(transactions),
            "insights": generate_insights(transactions),
        }
    except Exception as error:
        if isinstance(error, BankStatementProcessingError):
            raise
        raise BankStatementProcessingError(str(error) or "Failed to process bank statement") from error
