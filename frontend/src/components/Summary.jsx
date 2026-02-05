function Summary({ totalCredit, totalDebit, netAmount }) {
  return (
    <div className="summary">
      <div className="summary-card credit">
        <span>💰  Total Credit</span>
        <strong>₹ {totalCredit}</strong>
      </div>

      <div className="summary-card debit">
        <span>💸  Total Debit</span>
        <strong>₹ {totalDebit}</strong>
      </div>

      <div className="summary-card net">
        <span>📊 Net Amount</span>
        <strong>₹ {netAmount}</strong>
      </div>
    </div>
  );
}

export default Summary;
