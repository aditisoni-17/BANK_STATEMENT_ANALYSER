import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./auth";
import InsightBanner from "./components/InsightBanner";
import InsightsPanel from "./components/InsightsPanel";
import SummaryCards from "./components/SummaryCards";
import TransactionsTable from "./components/TransactionsTable";
import { navigateTo } from "./router";

const JOB_KEY = "analysisJobId";
const POLL_INTERVAL_MS = 1500;
const ChartSection = lazy(() => import("./components/ChartSection"));

function normalizeAnalysisPayload(payload) {
  if (!payload) {
    return null;
  }

  const data = payload.data || payload.result || payload;
  if (!data) {
    return null;
  }

  return {
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    insights: data.insights || null,
  };
}

function getJobId() {
  try {
    return localStorage.getItem(JOB_KEY) || "";
  } catch {
    return "";
  }
}

function Dashboard() {
  const [jobId] = useState(() => getJobId());
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [jobStatus, setJobStatus] = useState("idle");

  useEffect(() => {
    if (!jobId) {
      setAnalysis(null);
      setLoading(false);
      setJobStatus("idle");
      return undefined;
    }

    let cancelled = false;
    let pollTimer = null;

    const fetchJob = async () => {
      try {
        const payload = await apiRequest(`/jobs/${jobId}`);
        const job = payload?.data || payload;
        const status = job?.status || "unknown";

        if (cancelled) {
          return;
        }

        setJobStatus(status);

        if (status === "completed") {
          const nextAnalysis = normalizeAnalysisPayload(job.result || job);

          if (!nextAnalysis || nextAnalysis.transactions.length === 0) {
            throw new Error("Completed job did not return parsed analysis data");
          }

          setAnalysis(nextAnalysis);
          setLoading(false);
          setError("");
          window.clearInterval(pollTimer);
          return;
        }

        if (status === "failed") {
          setAnalysis(null);
          setLoading(false);
          setError(job?.error || "Processing failed");
          window.clearInterval(pollTimer);
          return;
        }

        setLoading(true);
        setError("");
      } catch (jobError) {
        if (jobError?.status === 401) {
          return;
        }

        if (!cancelled) {
          setLoading(false);
          setAnalysis(null);
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
  }, [jobId, retryToken]);

  const transactions = Array.isArray(analysis?.transactions) ? analysis.transactions : [];
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

  const handleRetry = () => {
    setError("");
    setLoading(Boolean(jobId));
    setRetryToken((value) => value + 1);
  };

  const pageShell = "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8";

  if (!jobId) {
    return (
      <main className={pageShell}>
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Statement analysis
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            No analysis found
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Upload a statement first so the dashboard can fetch results from the backend.
          </p>
          <button
            type="button"
            onClick={() => navigateTo("/upload")}
            className="mt-6 inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Go to upload
          </button>
        </div>
      </main>
    );
  }

  if (loading && !analysis) {
    return (
      <main className={pageShell}>
        <div className="grid gap-6 rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-10">
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Loading dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Fetching your analysis
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              We are loading the latest processing job from the backend.
            </p>
          </div>
          <div className="h-1.5 w-64 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-500" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={pageShell}>
        <div className="rounded-[28px] border border-rose-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
            Dashboard error
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Could not load analysis
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{error}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => navigateTo("/upload")}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              Upload again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className={pageShell}>
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Statement analysis
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            No data available
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            We could not find a finished analysis for this job yet.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-6 inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (transactions.length === 0) {
    return (
      <main className={pageShell}>
        <div className="grid gap-6 rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-10">
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Statement analysis
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              No transactions detected
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {insights?.human_summary ||
                "The uploaded statement was processed successfully, but no transactions could be extracted."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Retry processing
            </button>
            <button
              type="button"
              onClick={() => navigateTo("/upload")}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              Upload another file
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={pageShell}>
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Statement analysis
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Connected to live backend results from the processing job.
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Job status: {jobStatus}
          </p>
        </div>

        <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:min-w-[240px]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="block text-xs font-medium text-slate-500">Transactions</span>
              <strong className="text-2xl font-semibold tracking-tight text-slate-950">
                {transactions.length}
              </strong>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              Live data
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-500">Top category</span>
            <strong className="mt-1 block text-base font-semibold text-slate-950">
              {insights?.top_category ??
                insights?.highest_category?.category ??
                insights?.highestCategory ??
                "N/A"}
            </strong>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8">
        <InsightBanner insights={insights} />

        <SummaryCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netSavings={totalIncome - totalExpense}
          totalTransactions={totalTransactions}
        />

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
          <Suspense
            fallback={
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 h-4 w-32 rounded-full bg-slate-200" />
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="h-[300px] rounded-[20px] bg-slate-100" />
                  <div className="h-[300px] rounded-[20px] bg-slate-100" />
                </div>
              </div>
            }
          >
            <ChartSection categoryBreakdown={categoryBreakdown} />
          </Suspense>
          <InsightsPanel insights={insights} transactions={transactions} />
        </section>

        <section className="grid gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Transactions
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Parsed transactions
              </h2>
            </div>
            <span className="hidden rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 sm:inline-flex">
              {totalTransactions} rows
            </span>
          </div>
          <TransactionsTable transactions={transactions} />
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
