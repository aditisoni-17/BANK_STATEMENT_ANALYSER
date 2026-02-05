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
  const [summary, setSummary] = useState(null);

  const handleUploadSuccess = (data) => {
    setTransactions(data.transactions);
    setSummary(data.summary);
  };

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
      <Upload onUploadSuccess={handleUploadSuccess} />
      {summary && <Summary data={summary} />}

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
