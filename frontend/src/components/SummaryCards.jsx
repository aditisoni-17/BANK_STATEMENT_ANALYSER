import { memo } from "react";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function SummaryCards({ totalIncome = 0, totalExpense = 0, netSavings = 0, totalTransactions = 0 }) {
  const cards = [
    {
      label: "Total income",
      value: formatCurrency(totalIncome),
      tone: "text-emerald-600",
      accent: "bg-emerald-50 ring-emerald-100",
    },
    {
      label: "Total expense",
      value: formatCurrency(totalExpense),
      tone: "text-rose-600",
      accent: "bg-rose-50 ring-rose-100",
    },
    {
      label: "Net savings",
      value: formatCurrency(netSavings),
      tone: "text-sky-600",
      accent: "bg-sky-50 ring-sky-100",
    },
    {
      label: "Total transactions",
      value: String(totalTransactions || 0),
      tone: "text-slate-900",
      accent: "bg-slate-50 ring-slate-200",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`group rounded-xl bg-white p-5 shadow-sm ring-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${card.accent}`}
        >
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <strong className={`text-2xl font-semibold tracking-tight transition-colors duration-200 ${card.tone}`}>
              {card.value}
            </strong>
            <span className="text-xs font-medium text-slate-400 transition-colors duration-200 group-hover:text-slate-500">
              +10% from last analysis
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export default memo(SummaryCards);
