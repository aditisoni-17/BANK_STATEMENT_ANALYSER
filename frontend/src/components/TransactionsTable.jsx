function formatConfidence(confidence) {
  const value = Math.round((Number(confidence) || 0) * 100);
  return `${value}%`;
}

function TransactionsTable({ transactions }) {
  return (
    <table className="transactions-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {transactions.map((tx, index) => (
          <tr
            key={index}
            className={tx.anomaly ? "anomaly-row" : ""}
            style={(Number(tx.confidence) || 0) < 0.6 ? { backgroundColor: "#fff7cc" } : undefined}
          >
            <td>{tx.date}</td>
            <td>{tx.description}</td>
            <td>{`${tx.category || "OTHER"} (${formatConfidence(tx.confidence)})`}</td>
            <td className={tx.amount < 0 ? "debit" : "credit"}>
              {tx.amount}
            </td>
            <td>
              <span className={tx.anomaly ? "anomaly-badge" : "normal-badge"}>
                {tx.anomaly ? "Anomaly" : "Normal"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TransactionsTable;
