import re
from typing import Dict, List, Optional

from predict import predict_category
from ocr.config import ACCOUNT_HOLDER

DATE_PATTERN = re.compile(r"\b\d{2}/\d{2}/\d{4}\b")
AMOUNT_PATTERN = re.compile(r"(?<![A-Za-z0-9.])(\d+\.\d{2})(?![A-Za-z0-9.])")
NOISE_PATTERN = re.compile(
    r"\b(?:PAGE\s+\d+\s+OF\s+\d+|TRANSACTION|CHEQUE|WITHDRAWALS|RUNNING\s+BALANCE)\b"
)
MAX_TRANSACTION_AMOUNT = 1_000_000


def classify_transaction(description: str) -> str:
    try:
        category = predict_category(description)
        return category or "OTHER"
    except Exception:
        return "OTHER"


def _normalize_text(clean_text: str) -> str:
    text = clean_text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _normalize_amount(raw_amount: str) -> float:
    return float(raw_amount)


def _clean_description(raw_description: str) -> str:
    description = DATE_PATTERN.sub(" ", raw_description)
    description = NOISE_PATTERN.sub(" ", description)
    description = re.sub(r"\s+", " ", description)
    return description.strip(" -|:.,")


def _infer_signed_amount(description: str, amount: float) -> float:
    desc = description.upper()
    account_holder = ACCOUNT_HOLDER.upper()

    credit_markers = (
        f"TO {account_holder}",
        f"TO:{account_holder}",
        f"TO{account_holder}",
        " BY ",
        "SALARY",
        "CREDIT",
        "REFUND",
        "REVERSAL",
        "INTEREST",
        "DEPOSIT",
    )
    debit_markers = (" TO ", "TO:", "PURCHASE", "DEBIT", "WITHDRAW", "DR")

    if "FROM" in desc and any(marker in desc for marker in credit_markers):
        return amount
    if any(marker in desc for marker in ("CR", "CREDIT", "SALARY", "REFUND", "DEPOSIT")):
        return amount
    if any(marker in desc for marker in debit_markers):
        return -amount

    return -amount


def _select_transaction_amount_match(text: str):
    matches = [
        match
        for match in AMOUNT_PATTERN.finditer(text)
        if 0 < _normalize_amount(match.group(1)) <= MAX_TRANSACTION_AMOUNT
    ]

    if not matches:
        return None

    if len(matches) == 1:
        return matches[0]

    return matches[-2]


def _extract_transaction(chunk: str) -> Optional[Dict[str, object]]:
    date_match = DATE_PATTERN.search(chunk)
    amount_match = _select_transaction_amount_match(chunk)

    if not date_match or not amount_match:
        return None

    date = date_match.group()
    amount = _normalize_amount(amount_match.group(1))
    description = _clean_description(chunk[date_match.end() : amount_match.start()])

    if not description:
        return None

    signed_amount = _infer_signed_amount(description, amount)

    return {
        "date": date,
        "description": description,
        "amount": signed_amount,
        "category": classify_transaction(description),
    }


def parse_transactions(clean_text: str) -> List[dict]:
    useful_lines = []
    for line in clean_text.splitlines():
        line = re.sub(r"\s+", " ", line).strip()

        if not line:
            continue

        has_date = DATE_PATTERN.search(line)
        has_amount = AMOUNT_PATTERN.search(line)
        is_noise = NOISE_PATTERN.search(line.upper())

        if is_noise and not (has_date or has_amount):
            continue

        useful_lines.append(line)

    normalized_text = _normalize_text(" ".join(useful_lines))
    if not normalized_text:
        return []

    date_matches = list(DATE_PATTERN.finditer(normalized_text))
    if not date_matches:
        return []

    transactions: List[dict] = []

    for index, date_match in enumerate(date_matches):
        start = date_match.start()
        end = (
            date_matches[index + 1].start()
            if index + 1 < len(date_matches)
            else len(normalized_text)
        )
        chunk = normalized_text[start:end].strip()

        if not AMOUNT_PATTERN.search(chunk):
            continue

        transaction = _extract_transaction(chunk)
        if transaction and transaction["description"]:
            transactions.append(transaction)

    return transactions
