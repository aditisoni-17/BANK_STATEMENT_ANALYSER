import data from "./data/sample.json";
import "./index.css";

function App() {
  const totalCredit = data
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDebit = data
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const netAmount = totalCredit - totalDebit;

  return (
    <div className="container">
      <h1>🏦 Bank Statement Analyzer</h1>

      {/* 🔹 SUMMARY */}
      <div className="summary">
        <div className="summary-card credit">
          <span>Total Credit</span>
          <strong>₹ {totalCredit}</strong>
        </div>

        <div className="summary-card debit">
          <span>Total Debit</span>
          <strong>₹ {totalDebit}</strong>
        </div>

        <div className="summary-card net">
          <span>Net Amount</span>
          <strong>₹ {netAmount}</strong>
        </div>
      </div>

      <h2>Transactions</h2>

      <table className="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {data.map((tx, index) => (
            <tr key={index}>
              <td>{tx.date}</td>
              <td>{tx.description}</td>
              <td className={tx.amount < 0 ? "debit" : "credit"}>
                {tx.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
