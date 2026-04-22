from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from statistics import mean, median, pstdev
from typing import Dict, List, Optional


def _safe_amount(value) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _format_currency(value: float) -> str:
    amount = abs(float(value or 0))
    return f"₹{amount:,.0f}"


def _normalize_category(category: object) -> str:
    text = str(category or "Others").strip()
    return text or "Others"


def _parse_date(value: object) -> Optional[datetime]:
    if not value:
        return None

    text = str(value).strip()
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def _group_transactions_by_day(transactions: List[dict]) -> Dict[str, float]:
    daily_expenses: Dict[str, float] = defaultdict(float)
    for transaction in transactions:
        amount = _safe_amount(transaction.get("amount"))
        if amount >= 0:
            continue

        date = transaction.get("date")
        if not date:
            continue

        parsed_date = _parse_date(date)
        if not parsed_date:
            continue

        daily_expenses[parsed_date.strftime("%d/%m/%Y")] += abs(amount)
    return daily_expenses


def _detect_unusual_transactions(transactions: List[dict]) -> List[dict]:
    if not transactions:
        return []

    already_flagged = [
        transaction
        for transaction in transactions
        if transaction.get("anomaly") is True
    ]
    if already_flagged:
        return [
            {
                **transaction,
                "reason": transaction.get("reason") or "Flagged by anomaly detector",
            }
            for transaction in already_flagged
        ]

    def _flag_group(group: List[dict], label: str) -> List[dict]:
        amounts = [
            abs(_safe_amount(transaction.get("amount")))
            for transaction in group
            if _safe_amount(transaction.get("amount")) != 0
        ]
        if len(amounts) < 2:
            return []

        center = mean(amounts)
        spread = pstdev(amounts) if len(amounts) >= 3 else 0.0
        group_median = median(amounts)
        unusual_group = []

        for transaction in group:
            amount = abs(_safe_amount(transaction.get("amount")))
            if amount == 0:
                continue

            z_score = (amount - center) / spread if spread else 0.0
            ratio_flag = group_median > 0 and amount >= (group_median * 5)
            z_flag = spread > 0 and abs(z_score) > 2

            if z_flag or ratio_flag:
                reason = "Amount is significantly different from comparable transactions"
                if ratio_flag and not z_flag:
                    reason = "Amount is much larger than the median of similar transactions"
                unusual_group.append(
                    {
                        **transaction,
                        "z_score": round(z_score, 2),
                        "reason": reason,
                        "segment": label,
                    }
                )

        return unusual_group

    debits = [transaction for transaction in transactions if _safe_amount(transaction.get("amount")) < 0]
    credits = [transaction for transaction in transactions if _safe_amount(transaction.get("amount")) > 0]

    unusual = _flag_group(debits, "debit")
    unusual.extend(_flag_group(credits, "credit"))
    return unusual


def _build_spending_pattern(
    transactions: List[dict],
    category_totals: Dict[str, float],
    total_expense: float,
) -> Dict[str, object]:
    expense_transactions = [
        transaction
        for transaction in transactions
        if _safe_amount(transaction.get("amount")) < 0
    ]

    expense_days = _group_transactions_by_day(transactions)
    peak_day = None
    if expense_days:
        peak_date = max(expense_days, key=expense_days.get)
        peak_day = {
            "date": peak_date,
            "amount": round(expense_days[peak_date], 2),
        }

    weekend_spend = 0.0
    for transaction in expense_transactions:
        parsed_date = _parse_date(transaction.get("date"))
        amount = abs(_safe_amount(transaction.get("amount")))
        if not parsed_date:
            continue
        if parsed_date.weekday() >= 5:
            weekend_spend += amount

    weekend_share = round((weekend_spend / total_expense) * 100, 2) if total_expense else 0.0
    average_expense = round(total_expense / max(len(expense_transactions), 1), 2)
    top_category_share = 0.0
    top_category = None
    if category_totals:
        top_category = max(category_totals, key=category_totals.get)
        top_category_share = round((category_totals[top_category] / total_expense) * 100, 2) if total_expense else 0.0

    summary_parts = []
    if top_category:
        summary_parts.append(f"Spending is concentrated in {top_category.upper()}")
    if peak_day:
        summary_parts.append(
            f"Highest single-day spend was {_format_currency(peak_day['amount'])} on {peak_day['date']}"
        )
    if weekend_share and weekend_share >= 50:
        summary_parts.append(f"{weekend_share:.0f}% of spending happened on weekends")

    if not summary_parts:
        summary_parts.append("Spending pattern is evenly distributed across the statement")

    return {
        "average_expense_per_transaction": round(average_expense, 2),
        "peak_spend_day": peak_day,
        "weekend_spend_share": weekend_share,
        "top_category_share": top_category_share,
        "expense_days": len(expense_days),
        "summary": ". ".join(summary_parts),
    }


def _generate_human_insights(
    total_expense: float,
    top_category: Optional[str],
    unusual_transactions: List[dict],
    spending_pattern: Dict[str, object],
) -> List[str]:
    insights = []

    insights.append(f"You spent {_format_currency(total_expense)} this month")

    if top_category:
        insights.append(f"Most spent on {top_category.upper()}")

    for transaction in unusual_transactions[:3]:
        amount = _format_currency(transaction.get("amount", 0))
        description = str(transaction.get("description") or "").strip()
        label = f"Unusual {amount} detected"
        if description:
            label = f"{label}: {description}"
        insights.append(label)

    pattern_summary = spending_pattern.get("summary")
    if pattern_summary:
        insights.append(str(pattern_summary))

    return insights


def generate_insights(transactions: List[dict]) -> Dict[str, object]:
    safe_transactions = [transaction for transaction in transactions or [] if isinstance(transaction, dict)]

    income_transactions = [
        transaction
        for transaction in safe_transactions
        if _safe_amount(transaction.get("amount")) > 0
    ]
    expense_transactions = [
        transaction
        for transaction in safe_transactions
        if _safe_amount(transaction.get("amount")) < 0
    ]

    total_income = round(sum(_safe_amount(transaction.get("amount")) for transaction in income_transactions), 2)
    total_expense = round(sum(abs(_safe_amount(transaction.get("amount"))) for transaction in expense_transactions), 2)

    category_totals: Dict[str, float] = defaultdict(float)
    for transaction in expense_transactions:
        category = _normalize_category(transaction.get("category"))
        category_totals[category] += abs(_safe_amount(transaction.get("amount")))

    top_category = None
    highest_category = None
    if category_totals:
        category_name = max(category_totals, key=category_totals.get)
        top_category = category_name
        highest_category = {
            "category": category_name,
            "total_expense": round(category_totals[category_name], 2),
        }

    category_breakdown = [
        {
            "category": category,
            "amount": round(amount, 2),
            "share": round((amount / total_expense) * 100, 2) if total_expense else 0.0,
        }
        for category, amount in sorted(category_totals.items(), key=lambda item: item[1], reverse=True)
    ]

    unusual_transactions = _detect_unusual_transactions(safe_transactions)
    spending_pattern = _build_spending_pattern(safe_transactions, category_totals, total_expense)
    human_insights = _generate_human_insights(
        total_expense=total_expense,
        top_category=top_category,
        unusual_transactions=unusual_transactions,
        spending_pattern=spending_pattern,
    )

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_transactions": len(safe_transactions),
        "top_category": top_category,
        "category_breakdown": category_breakdown,
        "highest_category": highest_category,
        "number_of_transactions": len(safe_transactions),
        "unusual_transactions": unusual_transactions,
        "spending_pattern": spending_pattern,
        "human_summary": human_insights[0] if human_insights else "",
        "human_insights": human_insights,
        "summary_text": " | ".join(human_insights[:3]),
        "net_savings": round(total_income - total_expense, 2),
    }
