from typing import Dict, List


def generate_insights(transactions: List[dict]) -> Dict[str, object]:
    total_income = sum(
        transaction.get("amount", 0)
        for transaction in transactions
        if transaction.get("amount", 0) > 0
    )
    total_expense = sum(
        abs(transaction.get("amount", 0))
        for transaction in transactions
        if transaction.get("amount", 0) < 0
    )

    category_totals = {}
    for transaction in transactions:
        amount = transaction.get("amount", 0)
        if amount >= 0:
            continue

        category = transaction.get("category", "Others")
        category_totals[category] = category_totals.get(category, 0) + abs(amount)

    top_category = None
    highest_category = None
    if category_totals:
        category_name = max(category_totals, key=category_totals.get)
        top_category = category_name
        highest_category = {
            "category": category_name,
            "total_expense": category_totals[category_name],
        }

    category_breakdown = [
        {"category": category, "amount": amount}
        for category, amount in sorted(
            category_totals.items(), key=lambda item: item[1], reverse=True
        )
    ]

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_transactions": len(transactions),
        "top_category": top_category,
        "category_breakdown": category_breakdown,
        "highest_category": highest_category,
        "number_of_transactions": len(transactions),
    }
