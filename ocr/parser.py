import re
from ocr.config import ACCOUNT_HOLDER;

def classify_transaction(description):
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


def parse_transactions(clean_text):
    """
    Parses cleaned OCR text and extracts transactions
    Returns a list of dicts
    """

    transactions = []
    lines = clean_text.split("\n")

    date_pattern = re.compile(r"\d{2}/\d{2}/\d{4}")
    amount_pattern = re.compile(r"\d[\d\s]*\.\d{2}")

    for line in lines:
        date_match = date_pattern.search(line)
        amounts = amount_pattern.search(line)

        if not (date_match and amounts):
            continue

        amount = float(amounts.group().replace(" ", ""))
        description = line.strip()
        desc = description.upper()



        # 🔹 Debit / Credit logic
        if "FROM" in desc and f"TO {ACCOUNT_HOLDER}" in desc:
            amount = amount      # credit
        else:
            amount = -amount     # debit

        transactions.append({
            "date": date_match.group(),
            "description": line.strip(),
            "amount": amount,
            "category": classify_transaction(description)
        })
    return transactions
