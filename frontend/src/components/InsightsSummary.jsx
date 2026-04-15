function InsightsSummary({ insights }) {
  if (!insights) {
    return null;
  }

  const totalExpense = insights.total_expense ?? insights.totalExpense ?? 0;
  const topCategory =
    insights.top_category ??
    insights.highest_category ??
    insights.highestCategory ??
    null;

  return (
    <div className="insights-summary">
      <div className="summary-card">
        <span>Total Expense</span>
        <strong>₹ {Number(totalExpense).toFixed(2)}</strong>
      </div>

      <div className="summary-card">
        <span>Top Category</span>
        <strong>
          {typeof topCategory === "string"
            ? topCategory
            : topCategory
              ? topCategory.category || topCategory.name
              : "N/A"}
        </strong>
      </div>
    </div>
  );
}

export default InsightsSummary;
