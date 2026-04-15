import { useMemo, useState } from "react";
import ExpenseChart from "./components/ExpenseChart";
import InsightsSummary from "./components/InsightsSummary";

const STORAGE_KEY = "analysis";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatConfidence(confidence) {
  return `${Math.round((Number(confidence) || 0) * 100)}%`;
}

function normalizeBreakdown(categoryBreakdown) {
  if (!categoryBreakdown) return [];

  if (Array.isArray(categoryBreakdown)) {
    return categoryBreakdown
      .map((item) => ({
        category: item.category || item.name || item.label || "Others",
        amount: Number(item.amount ?? item.value ?? item.total ?? 0),
      }))
      .filter((item) => item.category);
  }

  return Object.entries(categoryBreakdown).map(([category, amount]) => ({
    category,
    amount: Number(amount) || 0,
  }));
}

export default function Dashboard() {
  const [analysis] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const transactions = Array.isArray(analysis?.transactions)
    ? analysis.transactions
    : [];
  const insights = analysis?.insights || null;
  const categoryBreakdown = useMemo(
    () => normalizeBreakdown(insights?.category_breakdown),
    [insights]
  );

  if (!analysis || transactions.length === 0) {
    return (
      <div className="container">
        <div style={{ padding: "48px 0" }}>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "#666" }}>
            Statement analysis
          </p>
          <h1>No data available</h1>
          <p>Upload a statement first so the dashboard can read the saved analysis from localStorage.</p>
        </div>
      </div>
    );
  }

  const totalIncome = Number(insights?.total_income || 0);
  const totalExpense = Number(insights?.total_expense || 0);
  const totalTransactions = Number(
    insights?.total_transactions || insights?.number_of_transactions || transactions.length
  );

  const topCategory =
    insights?.top_category ||
    insights?.highest_category ||
    categoryBreakdown[0]?.category ||
    "N/A";

  const maxBreakdownValue = Math.max(
    0,
    ...categoryBreakdown.map((item) => Number(item.amount) || 0)
  );

  return (
    <div className="container">
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", margin: 0 }}>
            Statement analysis
          </p>
          <h1>Dashboard</h1>
          <p style={{ color: "#666" }}>Connected to live backend results from localStorage.</p>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span style={{ display: "block", fontSize: 12, color: "#666" }}>Transactions</span>
            <strong>{transactions.length}</strong>
          </div>
          <div>
            <span style={{ display: "block", fontSize: 12, color: "#666" }}>Top category</span>
            <strong>{topCategory}</strong>
          </div>
        </div>
      </header>

      <div className="summary">
        <div className="summary-card credit">
          <span>Total Income</span>
          <strong>{formatCurrency(totalIncome)}</strong>
        </div>

        <div className="summary-card debit">
          <span>Total Expense</span>
          <strong>{formatCurrency(totalExpense)}</strong>
        </div>

        <div className="summary-card net">
          <span>Total Transactions</span>
          <strong>{totalTransactions}</strong>
        </div>
      </div>

      {insights && <InsightsSummary insights={insights} />}

      <section style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", marginTop: 24 }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", margin: 0 }}>Expense chart</p>
            <h2>Category-wise expenses</h2>
          </div>
          <ExpenseChart transactions={transactions} />
        </div>

        <div className="analytics">
          <div style={{ marginBottom: 12 }}>
            <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", margin: 0 }}>Breakdown</p>
            <h2>Insights</h2>
          </div>
          <div>
            {categoryBreakdown.length === 0 ? (
              <p style={{ color: "#666" }}>No breakdown data available.</p>
            ) : (
              categoryBreakdown.map((item) => {
                const width =
                  maxBreakdownValue > 0
                    ? Math.max(8, Math.round((item.amount / maxBreakdownValue) * 100))
                    : 8;

                return (
                  <div key={item.category} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                      <span>{item.category}</span>
                      <strong>{formatCurrency(item.amount)}</strong>
                    </div>
                    <div className="bar" style={{ height: 12 }}>
                      <div
                        style={{
                          width: `${width}%`,
                          height: "100%",
                          background: "#111",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", margin: 0 }}>Transactions</p>
          <h2>Parsed transactions</h2>
        </div>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr key={`${tx.date}-${index}`}>
                <td>{tx.date}</td>
                <td>{tx.description}</td>
                <td className={Number(tx.amount) < 0 ? "debit" : "credit"}>
                  {formatCurrency(tx.amount)}
                </td>
                <td>{tx.category || "OTHER"}</td>
                <td>{formatConfidence(tx.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
