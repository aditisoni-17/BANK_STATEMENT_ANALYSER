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


def _fallback_insights(transactions):
    def _safe_amount(value):
        try:
            return float(value or 0)
        except (TypeError, ValueError):
            return 0.0

    amounts = [_safe_amount(transaction.get("amount")) for transaction in transactions]
    total_income = round(sum(amount for amount in amounts if amount > 0), 2)
    total_expense = round(sum(abs(amount) for amount in amounts if amount < 0), 2)

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_transactions": len(transactions),
        "top_category": None,
        "category_breakdown": [],
        "highest_category": None,
        "number_of_transactions": len(transactions),
        "unusual_transactions": [],
        "spending_pattern": {
            "average_expense_per_transaction": 0.0,
            "peak_spend_day": None,
            "weekend_spend_share": 0.0,
            "top_category_share": 0.0,
            "expense_days": 0,
            "summary": "Spending pattern could not be derived",
        },
        "human_summary": f"You spent ₹{total_expense:,.0f} this month",
        "human_insights": [f"You spent ₹{total_expense:,.0f} this month"],
        "summary_text": f"You spent ₹{total_expense:,.0f} this month",
        "net_savings": round(total_income - total_expense, 2),
    }


def _build_empty_result(message: str, raw_text: str = "", cleaned_text: str = "") -> Dict[str, object]:
    insights = _fallback_insights([])
    insights["human_summary"] = message
    insights["human_insights"] = [message]
    insights["summary_text"] = message
    insights["spending_pattern"]["summary"] = "No spending pattern available"

    return {
        "raw_text": raw_text,
        "cleaned_text": cleaned_text,
        "transactions": [],
        "summary": calculate_summary([]),
        "insights": insights,
        "message": message,
    }


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

        if not raw_text.strip():
            return _build_empty_result(
                "No readable text was extracted from the uploaded statement.",
                raw_text=raw_text,
                cleaned_text=cleaned_text,
            )

        try:
            transactions = parse_transactions(cleaned_text)
        except Exception as error:
            raise BankStatementProcessingError(f"Parsing failed: {error}") from error

        try:
            transactions = detect_anomalies(transactions)
        except Exception as error:
            raise BankStatementProcessingError(f"Anomaly detection failed: {error}") from error

        if not transactions:
            return _build_empty_result(
                "No transactions were detected in the uploaded statement.",
                raw_text=raw_text,
                cleaned_text=cleaned_text,
            )

        try:
            insights = generate_insights(transactions)
        except Exception:
            insights = _fallback_insights(transactions)

        return {
            "raw_text": raw_text,
            "cleaned_text": cleaned_text,
            "transactions": transactions,
            "summary": calculate_summary(transactions),
            "insights": insights,
        }
    except Exception as error:
        if isinstance(error, BankStatementProcessingError):
            raise
        raise BankStatementProcessingError(str(error) or "Failed to process bank statement") from error
