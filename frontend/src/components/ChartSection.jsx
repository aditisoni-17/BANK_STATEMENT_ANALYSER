import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEFAULT_COLORS = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#dc2626",
  "#16a34a",
  "#0891b2",
  "#9333ea",
  "#ca8a04",
  "#4f46e5",
];

function normalizeCategoryBreakdown(categoryBreakdown) {
  if (!categoryBreakdown) return [];

  if (Array.isArray(categoryBreakdown)) {
    return categoryBreakdown
      .map((item) => ({
        category: item.category || item.name || item.label || "Others",
        amount: Number(item.amount ?? item.value ?? item.total ?? 0),
      }))
      .filter((item) => item.category && item.amount > 0);
  }

  return Object.entries(categoryBreakdown)
    .map(([category, amount]) => ({
      category,
      amount: Number(amount) || 0,
    }))
    .filter((item) => item.category && item.amount > 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getColor(index) {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

function ChartSection({ categoryBreakdown }) {
  const data = normalizeCategoryBreakdown(categoryBreakdown);

  if (data.length === 0) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No category breakdown data available.
      </div>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Category share
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
              Donut chart
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            Expense mix
          </span>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                innerRadius={74}
                outerRadius={112}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.category} fill={getColor(index)} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Spending trend
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
              Expenses by category
            </h3>
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
            Bar chart
          </span>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, left: 12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(value) => `${value}`} stroke="#94a3b8" />
              <YAxis type="category" dataKey="category" width={110} stroke="#94a3b8" />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="amount" radius={[0, 10, 10, 0]}>
                {data.map((entry, index) => (
                  <Cell key={entry.category} fill={getColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}

export default memo(ChartSection);
