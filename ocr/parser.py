import re
from typing import Dict, List, Optional

from ocr.config import ACCOUNT_HOLDER

DATE_PATTERN = re.compile(r"\b\d{2}/\d{2}/\d{4}\b")
DECIMAL_PATTERN = re.compile(r"\d+\.\d{2}")
AMOUNT_PATTERN = re.compile(r"(?<![A-Za-z0-9.])(\d+\.\d{2})(?![A-Za-z0-9.])")
MAX_TRANSACTION_AMOUNT = 1_000_000
NOISE_PATTERN = re.compile(
    r"\b(?:PAGE\s+\d+\s+OF\s+\d+|TRANSACTION|CHEQUE|WITHDRAWALS|RUNNING\s+BALANCE)\b"
)


def classify_transaction(description: str) -> str:
    desc = description.upper()

    if "SALARY" in desc or "CREDIT" in desc:
        return "CREDIT"
    if "ATM" in desc:
        return "CASH_WITHDRAWAL"
    if "UPI" in desc:
        return "UPI"
    if "AMAZON" in desc or "FLIPKART" in desc:
        return "ECOMMERCE"

    return "OTHER"


def _normalize_text(clean_text: str) -> str:
    """
    Normalizes OCR text without depending on original line structure.
    OCR often inserts arbitrary newlines and inconsistent spacing, so we
    flatten the text and preserve date tokens as segmentation anchors.
    """
    text = clean_text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _normalize_amount(raw_amount: str) -> float:
    """
    Converts valid decimal amount strings like `1200.00` into a float.
    """
    return float(raw_amount)


def _is_valid_amount(match) -> bool:
    amount = _normalize_amount(match.group(1))
    return amount <= MAX_TRANSACTION_AMOUNT


def _select_transaction_amount_match(text: str):
    matches = list(re.finditer(r"\b\d{1,6}\.\d{2}\b", text))

    if not matches:
        return None

    valid_matches = []

    for match in matches:
        amount = float(match.group())

        # filter unrealistic values
        if 0 < amount < 100000:
            valid_matches.append(match)

    if not valid_matches:
        return None

    # pick LAST valid amount (most reliable)
    return valid_matches[-1]


def _clean_description(raw_description: str) -> str:
    """
    Removes the most common header/footer OCR noise while keeping
    transaction-specific content intact.
    """
    description = DATE_PATTERN.sub(" ", raw_description)
    description = NOISE_PATTERN.sub(" ", description)
    description = re.sub(r"\s+", " ", description)
    return description.strip(" -|:.,")


def _infer_signed_amount(description: str, amount: float) -> float:
    """
    Marks credits as positive and debits as negative.
    We prefer explicit money direction cues and fall back to debit.
    """
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


def _extract_transaction(chunk: str) -> Optional[Dict[str, object]]:
    """
    Parses one date-anchored chunk into a transaction.
    The chunk may still contain OCR noise, repeated dates, or balance values.
    If a row contains both transaction amount and running balance, we use the
    amount before the final balance value.
    """
    date_match = DATE_PATTERN.search(chunk)
    amount_match = _select_transaction_amount_match(chunk)

    if not date_match or not amount_match:
        return None

    date = date_match.group()
    amount = _normalize_amount(amount_match.group(1))
    description = _clean_description(chunk[date_match.end():amount_match.start()])

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
    """
    Segments OCR text using dates as anchors so merged lines such as:
    `02/01/2024 UPI TO JOHN 500.00 03/01/2024 SWIGGY 300.00`
    are split into separate transactions.
    """
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
        if transaction:
            amount = transaction["amount"]
            if amount is None or abs(amount) > 100000:
                continue

            if not transaction["description"]:
                continue

            transactions.append(transaction)

    return transactions
