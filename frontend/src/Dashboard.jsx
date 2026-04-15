import { useState } from "react";
import ChartSection from "./components/ChartSection";
import InsightBanner from "./components/InsightBanner";
import InsightsPanel from "./components/InsightsPanel";
import SummaryCards from "./components/SummaryCards";
import TransactionsTable from "./components/TransactionsTable";

const STORAGE_KEY = "analysis";

function Dashboard() {
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

  if (!analysis || transactions.length === 0) {
    return (
      <div className="container" style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 56px" }}>
        <div style={{ padding: "64px 0" }}>
          <p
            style={{
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#64748b",
              fontSize: 12,
            }}
          >
            Statement analysis
          </p>
          <h1 style={{ margin: "10px 0 8px", fontSize: 36, color: "#0f172a" }}>No data available</h1>
          <p style={{ margin: 0, color: "#64748b", maxWidth: 560, lineHeight: 1.6 }}>
            Upload a statement first so the dashboard can read the saved analysis from localStorage.
          </p>
        </div>
      </div>
    );
  }

  const totalIncome = Number(insights?.total_income || 0);
  const totalExpense = Number(insights?.total_expense || 0);
  const totalTransactions = Number(
    insights?.total_transactions || insights?.number_of_transactions || transactions.length
  );

  return (
    <main
      className="container"
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "32px 24px 56px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#64748b",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Statement analysis
          </p>
          <h1 style={{ margin: "10px 0 8px", fontSize: 38, lineHeight: 1.1, color: "#0f172a" }}>
            Dashboard
          </h1>
          <p style={{ margin: 0, color: "#64748b", maxWidth: 640, lineHeight: 1.6 }}>
            Connected to live backend results from localStorage.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            minWidth: 210,
            padding: 18,
            borderRadius: 20,
            background: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div>
            <span style={{ display: "block", fontSize: 12, color: "#64748b" }}>Transactions</span>
            <strong style={{ fontSize: 22, color: "#0f172a" }}>{transactions.length}</strong>
          </div>
          <div>
            <span style={{ display: "block", fontSize: 12, color: "#64748b" }}>Top category</span>
            <strong style={{ fontSize: 16, color: "#0f172a" }}>
              {insights?.top_category ??
                insights?.highest_category?.category ??
                insights?.highestCategory ??
                "N/A"}
            </strong>
          </div>
        </div>
      </header>

      <div style={{ display: "grid", gap: 24 }}>
        <InsightBanner insights={insights} />

        <SummaryCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netSavings={totalIncome - totalExpense}
          totalTransactions={totalTransactions}
        />

        <section
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 1fr)",
            alignItems: "start",
          }}
        >
          <ChartSection categoryBreakdown={insights?.category_breakdown} />
          <InsightsPanel insights={insights} transactions={transactions} />
        </section>

        <section
          style={{
            display: "grid",
            gap: 14,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#64748b",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Transactions
            </p>
            <h2 style={{ margin: "10px 0 0", fontSize: 24, color: "#0f172a" }}>Parsed transactions</h2>
          </div>
          <TransactionsTable transactions={transactions} />
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
