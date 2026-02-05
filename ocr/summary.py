def calculate_summary(transactions):
    total_credit = sum(
        t["amount"] for t in transactions if t["amount"] > 0
    )

    total_debit = sum(
        abs(t["amount"]) for t in transactions if t["amount"] < 0
    )

    return {
        "total_credit": total_credit,
        "total_debit": total_debit,
        "net_balance": total_credit - total_debit
    }
