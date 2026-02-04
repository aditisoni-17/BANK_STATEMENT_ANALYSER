import { useState } from "react";
import Analytics from "./components/Analytics";


import Upload from "./components/Upload";
import "./index.css";

import Summary from "./components/Summary";
import TransactionsTable from "./components/TransactionsTable";

function App() {
  const [transactions, setTransactions] = useState([]);
  const totalCredit = transactions
  .filter(tx => tx.amount > 0)
  .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDebit = transactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const netAmount = totalCredit - totalDebit;


  return (
    <div className="container">
      <h1>🏦 Bank Statement Analyzer</h1>
      <Upload onUploadSuccess={setTransactions} />



      <Summary
        totalCredit={totalCredit}
        totalDebit={totalDebit}
        netAmount={netAmount}
      />
      <Analytics totalCredit={totalCredit} totalDebit={totalDebit} />


      <h2>Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions found. Upload a bank statement.</p>
      ) : (
        <TransactionsTable transactions={transactions} />
      )}
    </div>
  );
}

export default App;
