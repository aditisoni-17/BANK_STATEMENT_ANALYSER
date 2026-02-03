import data from "./data/sample.json";
import Upload from "./components/Upload";
import "./index.css";

import Summary from "./components/Summary";
import TransactionsTable from "./components/TransactionsTable";

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
      <Upload />


      <Summary
        totalCredit={totalCredit}
        totalDebit={totalDebit}
        netAmount={netAmount}
      />

      <h2>Transactions</h2>

      <TransactionsTable transactions={data} />
    </div>
  );
}

export default App;
