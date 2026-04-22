import { memo } from "react";

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
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
      <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            AI insight
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            You spent{" "}
            <span className="inline-flex rounded-2xl bg-white/10 px-3 py-1.5 text-emerald-300 ring-1 ring-white/10">
              {formatCurrency(totalExpense)}
            </span>{" "}
            this month
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            {humanSummary}
          </p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl bg-white/8 p-5 ring-1 ring-white/10 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
              Top category
            </p>
            <strong className="mt-2 block text-xl font-semibold tracking-wide text-white">
              {String(topCategory).toUpperCase()}
            </strong>
          </div>

          <div className="rounded-2xl bg-white/8 p-5 ring-1 ring-white/10 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
              Savings
            </p>
            <strong className="mt-2 block text-xl font-semibold text-emerald-300">
              {formatCurrency(savings)}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(InsightBanner);
