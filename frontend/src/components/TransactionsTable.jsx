function TransactionsTable({ transactions }) {
  return (
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
              {tx.amount}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TransactionsTable;
