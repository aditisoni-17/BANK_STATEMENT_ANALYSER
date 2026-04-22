import { memo } from "react";

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
    <section className="grid gap-4">
      {cards.slice(0, 3).map((row, index) => (
        <article
          key={`${row.label}-${index}`}
          className="group flex gap-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
        >
          <div
            className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${
              row.tone === "warning"
                ? "bg-amber-500 ring-8 ring-amber-500/10"
                : "bg-sky-500 ring-8 ring-sky-500/10"
            }`}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold leading-6 text-slate-950">{row.label}</p>
              <span
                className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] sm:inline-flex ${
                  row.tone === "warning"
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                    : "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
                }`}
              >
                {row.tone}
              </span>
            </div>
            {row.value ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{row.value}</p>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}

export default memo(InsightsPanel);
