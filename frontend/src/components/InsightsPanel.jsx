function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getTopCategory(insights) {
  const topCategory =
    insights?.top_category ??
    insights?.highest_category ??
    insights?.highestCategory ??
    null;

  if (typeof topCategory === "string") {
    return topCategory;
  }

  return topCategory?.category || topCategory?.name || "OTHER";
}

function getUnusualTransactions(insights, transactions = []) {
  if (Array.isArray(insights?.unusual_transactions) && insights.unusual_transactions.length > 0) {
    return insights.unusual_transactions;
  }

  return transactions.filter((transaction) => transaction?.anomaly);
}

function InsightsPanel({ insights, transactions = [] }) {
  if (!insights) {
    return null;
  }

  const unusualTransactions = getUnusualTransactions(insights, transactions);
  const topCategory = getTopCategory(insights);
  const savings =
    insights.savings ??
    Math.max((insights.total_income || 0) - (insights.total_expense || 0), 0);

  const humanInsights = Array.isArray(insights.human_insights) ? insights.human_insights : [];

  const cards = humanInsights.length
    ? humanInsights.slice(0, 3).map((text) => ({
        tone: /unusual|warning|detected/i.test(text) ? "warning" : "info",
        label: text,
        value: "",
      }))
    : [
        {
          tone: "warning",
          label: `You spent most on ${String(topCategory).toUpperCase()}`,
          value: `Total expense ${formatCurrency(insights.total_expense || 0)}`,
        },
        {
          tone: "warning",
          label: unusualTransactions.length
            ? `Unusual transaction detected ${formatCurrency(unusualTransactions[0].amount)}`
            : "Unusual transaction detected",
          value: unusualTransactions[0]?.description || "No anomaly flagged",
        },
        {
          tone: "info",
          label: `You can save ${formatCurrency(savings)}`,
          value: "Based on current income vs expense pattern",
        },
      ];

  return (
    <section
      style={{
        display: "grid",
        gap: 14,
      }}
    >
      {cards.slice(0, 3).map((row, index) => (
        <article
          key={`${row.label}-${index}`}
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            borderRadius: 22,
            border: "1px solid #e2e8f0",
            background: "#fff",
            padding: 18,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
            transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform = "translateY(-2px)";
            event.currentTarget.style.boxShadow = "0 14px 30px rgba(15, 23, 42, 0.08)";
            event.currentTarget.style.borderColor = row.tone === "warning" ? "#facc15" : "#93c5fd";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = "translateY(0)";
            event.currentTarget.style.boxShadow = "0 8px 24px rgba(15, 23, 42, 0.05)";
            event.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <div
            style={{
              flex: "0 0 auto",
              width: 10,
              height: 10,
              borderRadius: 9999,
              marginTop: 6,
              background: row.tone === "warning" ? "#f59e0b" : "#3b82f6",
              boxShadow:
                row.tone === "warning"
                  ? "0 0 0 6px rgba(245, 158, 11, 0.12)"
                  : "0 0 0 6px rgba(59, 130, 246, 0.12)",
            }}
          />

          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "#0f172a",
                fontWeight: 600,
              }}
            >
              {row.label}
            </p>
            {row.value ? (
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>{row.value}</p>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}

export default InsightsPanel;
