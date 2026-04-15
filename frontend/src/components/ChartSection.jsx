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
      <div
        style={{
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          background: "#fff",
          padding: 24,
          color: "#64748b",
        }}
      >
        No category breakdown data available.
      </div>
    );
  }

  return (
    <section
      style={{
        display: "grid",
        gap: 24,
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          background: "#fff",
          padding: 20,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          minHeight: 360,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
            Distribution
          </p>
          <h3 style={{ margin: "6px 0 0", fontSize: 18, color: "#0f172a" }}>Donut chart</h3>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius={72}
              outerRadius={108}
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

      <div
        style={{
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          background: "#fff",
          padding: 20,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          minHeight: 360,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
            Comparison
          </p>
          <h3 style={{ margin: "6px 0 0", fontSize: 18, color: "#0f172a" }}>Expenses by category</h3>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, left: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tickFormatter={(value) => `${value}`} stroke="#94a3b8" />
            <YAxis type="category" dataKey="category" width={110} stroke="#94a3b8" />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={getColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default ChartSection;
