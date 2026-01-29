import re

def parse_transactions(clean_text):
    """
    Parses cleaned OCR text and extracts transactions
    Returns a list of dicts
    """

    transactions = []

    # Regex pattern:
    # Date (DD-MM-YYYY) + Description + Amount + Balance
    pattern = re.compile(
        r"(\d{2}-\d{2}-\d{4})\s+([A-Z\s]+?)\s+(\d+)\s+(\d+)"
    )

    matches = pattern.findall(clean_text)

    for match in matches:
        date, description, amount, balance = match

        transactions.append({
            "date": date,
            "description": description.strip(),
            "amount": -int(amount),   # assuming debit for now
            "balance": int(balance)
        })

    return transactions


# 🧪 Testing (temporary)
if __name__ == "__main__":
    sample_text = """
    05-01-2025 SWIGGY ONLINE 450 49550
    10-01-2025 SALARY CREDIT 30000 79230
    20-01-2025 AMAZON PURCHASE 2499 76082
    """

    parsed = parse_transactions(sample_text)

    for t in parsed:
        print(t)
