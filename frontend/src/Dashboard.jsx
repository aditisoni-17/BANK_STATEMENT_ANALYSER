import { useEffect, useMemo, useState } from "react";
import ChartSection from "./components/ChartSection";
import InsightBanner from "./components/InsightBanner";
import InsightsPanel from "./components/InsightsPanel";
import SummaryCards from "./components/SummaryCards";
import TransactionsTable from "./components/TransactionsTable";

const STORAGE_KEY = "analysis";
const JOB_KEY = "analysisJobId";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const POLL_INTERVAL_MS = 1500;

function normalizeAnalysisPayload(payload) {
  if (!payload) {
    return null;
  }

  const data = payload.data || payload.result || payload;
  if (!data) {
    return null;
  }

  return {
    raw_text: data.raw_text || "",
    cleaned_text: data.cleaned_text || "",
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    insights: data.insights || null,
  };
}

function getStoredAnalysis() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function Dashboard() {
  const hasPendingJob = Boolean(localStorage.getItem(JOB_KEY));
  const [analysis, setAnalysis] = useState(() => getStoredAnalysis());
  const [loading, setLoading] = useState(hasPendingJob);
  const [error, setError] = useState("");

  useEffect(() => {
    const jobId = localStorage.getItem(JOB_KEY);

    if (!jobId) {
      const stored = getStoredAnalysis();
      if (stored) {
        setAnalysis(stored);
      }
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    let pollTimer = null;

    const persistAnalysis = (nextAnalysis) => {
      setAnalysis(nextAnalysis);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAnalysis));
    };

    const fetchJob = async () => {
      try {
        const response = await fetch(`${API_URL}/jobs/${jobId}`, {
          credentials: "include",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || payload?.detail || `Request failed with status ${response.status}`
          );
        }

        const job = payload?.data || payload;

        if (job?.status === "completed") {
          const nextAnalysis = normalizeAnalysisPayload(job.result || job.data || job);

          if (!nextAnalysis || nextAnalysis.transactions.length === 0) {
            throw new Error("Completed job did not return parsed analysis data");
          }

          persistAnalysis(nextAnalysis);
          localStorage.removeItem(JOB_KEY);
          setLoading(false);
          setError("");
          window.clearInterval(pollTimer);
          return;
        }

        if (job?.status === "failed") {
          localStorage.removeItem(JOB_KEY);
          setLoading(false);
          throw new Error(job?.error || "Processing failed");
        }

        setLoading(true);
        setError("");
      } catch (jobError) {
        if (!cancelled) {
          setLoading(false);
          setError(jobError.message || "Failed to load dashboard data");
        }
        window.clearInterval(pollTimer);
      }
    };

    fetchJob();
    pollTimer = window.setInterval(fetchJob, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(pollTimer);
    };
  }, []);

  const transactions = Array.isArray(analysis?.transactions)
    ? analysis.transactions
    : [];
  const insights = analysis?.insights || null;
  const categoryBreakdown = useMemo(() => {
    const breakdown = insights?.category_breakdown;

    if (!breakdown) {
      return [];
    }

    if (Array.isArray(breakdown)) {
      return breakdown
        .map((item) => ({
          category: item.category || item.name || item.label || "Others",
          amount: Number(item.amount ?? item.value ?? item.total ?? 0),
        }))
        .filter((item) => item.category);
    }

    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount: Number(amount) || 0,
    }));
  }, [insights]);

  const totalIncome = Number(insights?.total_income || 0);
  const totalExpense = Number(insights?.total_expense || 0);
  const totalTransactions = Number(
    insights?.total_transactions || insights?.number_of_transactions || transactions.length
  );

  if (loading && hasPendingJob) {
    return (
      <main
        className="container"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "32px 24px 56px",
        }}
      >
        <div
          style={{
            padding: "72px 0",
            display: "grid",
            gap: 14,
            justifyItems: "start",
          }}
        >
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
            Loading dashboard
          </p>
          <h1 style={{ margin: 0, fontSize: 36, color: "#0f172a" }}>Fetching your analysis</h1>
          <p style={{ margin: 0, color: "#64748b", maxWidth: 560, lineHeight: 1.6 }}>
            We are loading the latest processing job from the backend.
          </p>
        </div>
      </main>
    );
  }

  if (error && hasPendingJob) {
    return (
      <main
        className="container"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "32px 24px 56px",
        }}
      >
        <div
          style={{
            padding: "72px 0",
            display: "grid",
            gap: 14,
            justifyItems: "start",
          }}
        >
          <p
            style={{
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#b91c1c",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Dashboard error
          </p>
          <h1 style={{ margin: 0, fontSize: 36, color: "#0f172a" }}>Could not load analysis</h1>
          <p style={{ margin: 0, color: "#64748b", maxWidth: 560, lineHeight: 1.6 }}>
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!analysis || transactions.length === 0) {
    return (
      <main
        className="container"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "32px 24px 56px",
        }}
      >
        <div style={{ padding: "64px 0" }}>
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
          <h1 style={{ margin: "10px 0 8px", fontSize: 36, color: "#0f172a" }}>No data available</h1>
          <p style={{ margin: 0, color: "#64748b", maxWidth: 560, lineHeight: 1.6 }}>
            Upload a statement first so the dashboard can read the saved analysis from the backend.
          </p>
        </div>
      </main>
    );
  }

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
            Connected to live backend results from the processing job.
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
          <ChartSection categoryBreakdown={categoryBreakdown} />
          <InsightsPanel insights={insights} transactions={transactions} />
        </section>

        <section style={{ display: "grid", gap: 14 }}>
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
