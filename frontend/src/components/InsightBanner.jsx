function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function InsightBanner({ insights }) {
  if (!insights) {
    return null;
  }

  const totalExpense =
    insights.total_expense ?? insights.totalExpense ?? insights.monthly_expense ?? 0;

  const humanSummary =
    insights.human_summary || `You spent ${formatCurrency(totalExpense)} this month`;

  const topCategory =
    insights.top_category ??
    insights.highest_category?.category ??
    insights.highestCategory ??
    "OTHER";

  const savings =
    insights.savings ??
    Math.max((insights.total_income || 0) - (insights.total_expense || 0), 0);

  return (
    <section
      style={{
        borderRadius: 28,
        background:
          "linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 45%, rgba(15,118,110,1) 100%)",
        color: "#fff",
        padding: 28,
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
      }}
    >
      <p
        style={{
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
        }}
      >
        AI Insight
      </p>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          alignItems: "stretch",
          marginTop: 18,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.2, fontWeight: 700 }}>
            You spent{" "}
            <span
              style={{
                display: "inline-block",
                padding: "0.1rem 0.55rem",
                borderRadius: 14,
                background: "rgba(255,255,255,0.12)",
                color: "#d1fae5",
              }}
            >
              {formatCurrency(totalExpense)}
            </span>{" "}
            this month
          </h2>
          <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,0.82)", fontSize: 14 }}>
            {humanSummary}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            alignContent: "start",
          }}
        >
          <div
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.08)",
              padding: 16,
              backdropFilter: "blur(12px)",
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
              Top category
            </p>
            <strong style={{ display: "block", marginTop: 6, fontSize: 20, letterSpacing: 0.4 }}>
              {String(topCategory).toUpperCase()}
            </strong>
          </div>

          <div
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.08)",
              padding: 16,
              backdropFilter: "blur(12px)",
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
              Savings
            </p>
            <strong style={{ display: "block", marginTop: 6, fontSize: 20 }}>
              {formatCurrency(savings)}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InsightBanner;
