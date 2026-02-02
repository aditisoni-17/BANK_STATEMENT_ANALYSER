
def parse_transactions(clean_text):
    """
    Parses cleaned OCR text and extracts transactions
    Returns a list of dicts
    """

    transactions = []
    lines = clean_text.split("\n")

    date_pattern = re.compile(r"\d{2}-\d{2}-\d{4}")
    amount_pattern = re.compile(r"\d{3,}")

    for line in lines:
        date_match = date_pattern.search(line)
        amounts = amount_pattern.findall(line)

        if date_match and len(amounts) >= 1:
            desc = line.upper()
            amount = int(amounts[0])

            # 🔹 Debit / Credit logic
            if "SALARY" in desc or "CREDIT" in desc:
                amount = amount      # credit
            else:
                amount = -amount     # debit

            transactions.append({
                "date": date_match.group(),
                "description": line.strip(),
                "amount": amount
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
