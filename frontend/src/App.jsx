import { useState } from "react";
import Analytics from "./components/Analytics";
import Filters from "./components/Filters";
import ExportButtons from "./components/ExportButtons";



import Upload from "./components/Upload";
import "./index.css";

import Summary from "./components/Summary";
import TransactionsTable from "./components/TransactionsTable";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const totalCredit = transactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDebit = transactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const netAmount = totalCredit - totalDebit;

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesType =
      type === "all" ||
      (type === "credit" && tx.amount > 0) ||
      (type === "debit" && tx.amount < 0);

    return matchesSearch && matchesType;
  });


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
      <Filters
        search={search}
        setSearch={setSearch}
        type={type}
        setType={setType}
      />
      <ExportButtons data={filteredTransactions} />





      <h2>Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions found. Upload a bank statement.</p>
      ) : (
        <TransactionsTable transactions={filteredTransactions} />

      )}
    </div>
  );
}

export default App;
