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
    clean_text = re.sub(r'(\d)\s(\d{3}\.\d{2})', r'\1\2', clean_text)

    # Pattern: amount + balance pair
    txn_pattern = re.compile(r'(.*?\d+\.\d{2}\s+\d+\.\d{2})')

    blocks = txn_pattern.findall(clean_text)

    previous_balance = None

    for block in blocks:
        date_match = re.search(r"\d{2}/\d{2}/\d{4}", block)
        amounts = re.findall(r"\d+\.\d{2}", block)

        if not (date_match and len(amounts)>2):
            continue

        amount = float(amounts[-2])
        balance = float(amounts[-1])
        description = re.sub(r"\d+\.\d{2}", "", block)
        description = re.sub(r"\s+", " ", description).strip()
        desc_upper = description.upper()



        # 🔹 Debit / Credit logic
        if previous_balance is not None:
            if balance > previous_balance:
                signed_amount = amount   # credit
            else:
                signed_amount = -amount  # debit
        else:
            # fallback logic
            signed_amount = amount if "FROM" in desc_upper else -amount

        transactions.append({
            "date": date_match.group(),
            "description": description,
            "amount": signed_amount,
            "balance": balance,
            "category": classify_transaction(description)
        })

        previous_balance = balance

    return transactions
