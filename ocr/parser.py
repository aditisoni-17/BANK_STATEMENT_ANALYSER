import re 
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
        desc = line.upper()

        

        # 🔹 Debit / Credit logic
        if "FROM" in desc and "TO NSACHDEV" in desc:
            amount = amount      # credit
        else:
            amount = -amount     # debit

        transactions.append({
            "date": date_match.group(),
            "description": line.strip(),
            "amount": amount
        })
    return transactions
