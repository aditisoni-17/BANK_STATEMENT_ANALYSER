import { useEffect, useState } from "react";
import { apiRequest } from "./auth";
import { navigateTo, useNavigate } from "./router";

const JOB_KEY = "analysisJobId";
const REDIRECT_DELAY_MS = 1200;
const POLL_INTERVAL_MS = 1500;

function Processing() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Analyzing your statement...");
  const [error, setError] = useState("");
  const [terminalState, setTerminalState] = useState(false);

  useEffect(() => {
    const jobId = localStorage.getItem(JOB_KEY);

    if (!jobId) {
      navigateTo("/upload");
      return undefined;
    }

    let cancelled = false;
    let pollTimer = null;

    const clearJobAndRedirect = (path, delay = 0) => {
      window.setTimeout(() => {
        if (!cancelled) {
          navigate(path);
        }
      }, delay);
    };

    const pollJob = async () => {
      if (cancelled) {
        return;
      }

      try {
        const job = await apiRequest(`/jobs/${jobId}`);
        const status = job?.status;

        if (status === "completed") {
          setMessage("Analysis complete");
          setProgress(100);
          setTerminalState(false);
          window.clearInterval(pollTimer);
          clearJobAndRedirect("/dashboard", 900);
          return;
        }

        if (status === "failed") {
          setMessage("Processing failed");
          setError(job?.error || "Processing failed");
          setProgress(100);
          setTerminalState(true);
          window.clearInterval(pollTimer);
          return;
        }

        setMessage("Analyzing your statement...");
      } catch (pollError) {
        if (pollError?.status === 401) {
          return;
        }

        localStorage.removeItem(JOB_KEY);
        setError(pollError.message || "Unable to process the uploaded file");
        setTerminalState(true);
        setProgress(100);
        window.clearInterval(pollTimer);
      }
    };

    const initialDelay = window.setTimeout(() => {
      pollJob();
      pollTimer = window.setInterval(pollJob, POLL_INTERVAL_MS);
    }, REDIRECT_DELAY_MS);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? 92 : current + 6));
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(initialDelay);
      window.clearInterval(progressTimer);
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
    };
  }, [navigate]);

  const retryProcessing = () => {
    setError("");
    setTerminalState(false);
    setMessage("Analyzing your statement...");
    setProgress(0);
    localStorage.removeItem(JOB_KEY);
    navigateTo("/upload");
  };

  if (terminalState && error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div className="w-full max-w-2xl rounded-[28px] border border-rose-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
            Processing error
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            We could not finish analyzing your statement
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{error}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={retryProcessing}
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
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 820 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 48 }}>
          <div style={{ position: "relative", width: 64, height: 64, marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "9999px",
                border: "4px solid #e2e8f0",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "9999px",
                border: "4px solid transparent",
                borderTopColor: "#10b981",
                animation: "statement-spin 1s linear infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              ⋯
            </div>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 600, color: "#0f172a", margin: 0, marginBottom: 8 }}>
            {message}
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14, marginBottom: 20 }}>
            Please wait while we process your bank statement
          </p>

          <div
            style={{
              width: 280,
              height: 6,
              borderRadius: 9999,
              background: "#e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 9999,
                background: error ? "#dc2626" : "#10b981",
                transition: "width 220ms ease-out",
              }}
            />
          </div>
          {error && (
            <p style={{ marginTop: 16, color: "#dc2626", fontSize: 14, textAlign: "center" }}>
              {error}
            </p>
          )}
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <div style={{ width: 8, height: 8, borderRadius: 9999, background: "#10b981" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Preview
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 24 }}>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{
                  background: "#f8fafc",
                  borderRadius: 16,
                  padding: 16,
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ height: 12, width: 64, background: "#e2e8f0", borderRadius: 9999, marginBottom: 12 }} />
                <div style={{ height: 24, width: 96, background: "#e2e8f0", borderRadius: 9999 }} />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                paddingBottom: 12,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ height: 12, width: 96, background: "#e2e8f0", borderRadius: 9999 }} />
              <div style={{ height: 12, width: 128, background: "#e2e8f0", borderRadius: 9999, marginLeft: "auto" }} />
              <div style={{ height: 12, width: 80, background: "#e2e8f0", borderRadius: 9999 }} />
            </div>

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "8px 0",
                  opacity: 1 - item * 0.18,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "9999px", background: "#e2e8f0" }} />
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ height: 12, width: 112, background: "#e2e8f0", borderRadius: 9999 }} />
                    <div style={{ height: 8, width: 80, background: "#f1f5f9", borderRadius: 9999 }} />
                  </div>
                </div>
                <div style={{ height: 12, width: 64, background: "#e2e8f0", borderRadius: 9999 }} />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
            marginTop: 24,
            fontSize: 12,
            color: "#94a3b8",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 9999, background: "#10b981", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
              ✓
            </span>
            File uploaded
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#0f172a" }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 9999,
                border: "2px solid #10b981",
                borderTopColor: "transparent",
                animation: "statement-spin 1s linear infinite",
                display: "inline-block",
              }}
            />
            Extracting data
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 9999, border: "2px solid #e2e8f0", display: "inline-block" }} />
            Generating insights
          </span>
        </div>
      </div>

      <style>{`
        @keyframes statement-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Processing;
