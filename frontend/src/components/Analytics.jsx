function Analytics({ totalCredit, totalDebit }) {
  return (
    <div className="analytics">
      <h3>📊 Analytics</h3>

      <div className="bar">
        <div
          className="bar-credit"
          style={{ width: `${totalCredit / (totalCredit + totalDebit) * 100 || 0}%` }}
        >
          Credit ₹{totalCredit}
        </div>
      </div>

      <div className="bar">
        <div
          className="bar-debit"
          style={{ width: `${totalDebit / (totalCredit + totalDebit) * 100 || 0}%` }}
        >
          Debit ₹{totalDebit}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
