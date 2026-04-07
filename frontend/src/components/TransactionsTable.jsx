const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

function TransactionsTable({ transactions, totalCount }) {
  const visibleCount = transactions.length;
  const overallCount = totalCount ?? visibleCount;

  return (
    <>
      <p className="transaction-count">
        Showing {visibleCount} of {overallCount} transactions
      </p>

      <table className="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((tx, index) => (
            <tr key={index}>
              <td>{tx.date}</td>
              <td>{tx.description}</td>
              <td className={tx.amount < 0 ? "debit" : "credit"}>
                {formatCurrency(tx.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default TransactionsTable;
