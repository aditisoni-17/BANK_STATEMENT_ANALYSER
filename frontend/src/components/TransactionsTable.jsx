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
    return {
      background: "#ecfdf5",
      color: "#047857",
      border: "#bbf7d0",
    };
  }

  if (value < 0.5) {
    return {
      background: "#fffbeb",
      color: "#b45309",
      border: "#fde68a",
    };
  }

  return {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "#bfdbfe",
  };
}

function TransactionsTable({ transactions = [] }) {
  if (!transactions.length) {
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
        No transactions available.
      </div>
    );
  }

  return (
    <div
      style={{
        overflow: "hidden",
        borderRadius: 24,
        border: "1px solid #e2e8f0",
        background: "#fff",
        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table className="transactions-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Date</th>
              <th style={{ textAlign: "left" }}>Description</th>
              <th style={{ textAlign: "left" }}>Amount</th>
              <th style={{ textAlign: "left" }}>Category</th>
              <th style={{ textAlign: "left" }}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => {
              const amount = Number(tx.amount) || 0;
              const confidence = Number(tx.confidence) || 0;
              const confidenceTone = getConfidenceTone(confidence);

              return (
                <tr
                  key={`${tx.date}-${index}`}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                    transition: "background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = "#eff6ff";
                    event.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8fafc";
                    event.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <td>{tx.date}</td>
                  <td>{tx.description}</td>
                  <td style={{ color: amount < 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                    {formatCurrency(amount)}
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.35rem 0.75rem",
                        borderRadius: 9999,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        color: "#334155",
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: 0.2,
                      }}
                    >
                      {tx.category || "OTHER"}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0.35rem 0.75rem",
                        borderRadius: 9999,
                        background: confidenceTone.background,
                        color: confidenceTone.color,
                        border: `1px solid ${confidenceTone.border}`,
                        fontSize: 12,
                        fontWeight: 700,
                        minWidth: 88,
                        justifyContent: "center",
                      }}
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

export default TransactionsTable;
