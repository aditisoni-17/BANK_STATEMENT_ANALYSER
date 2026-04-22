import { memo } from "react";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatConfidence(confidence) {
  return Math.round((Number(confidence) || 0) * 100);
}

function getConfidenceTone(confidence) {
  const value = Number(confidence) || 0;

  if (value > 0.8) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (value < 0.5) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-sky-50 text-sky-700 ring-sky-100";
}

function TransactionsTable({ transactions = [] }) {
  if (!transactions.length) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No transactions available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-slate-950 text-left text-white">
            <tr>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Date
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Description
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Amount
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Category
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => {
              const amount = Number(tx.amount) || 0;
              const confidence = Number(tx.confidence) || 0;

              return (
                <tr
                  key={`${tx.date}-${index}`}
                  className={`transition-colors duration-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                  } hover:bg-sky-50/70`}
                >
                  <td className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
                    {tx.date}
                  </td>
                  <td className="border-t border-slate-100 px-5 py-4 text-sm font-medium text-slate-900">
                    {tx.description}
                  </td>
                  <td
                    className={`border-t border-slate-100 px-5 py-4 text-sm font-semibold ${
                      amount < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(amount)}
                  </td>
                  <td className="border-t border-slate-100 px-5 py-4">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
                      {tx.category || "OTHER"}
                    </span>
                  </td>
                  <td className="border-t border-slate-100 px-5 py-4">
                    <span
                      className={`inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getConfidenceTone(
                        confidence
                      )}`}
                    >
                      {formatConfidence(confidence)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(TransactionsTable);
