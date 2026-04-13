import { useState } from "react";
import Filters from "./components/Filters";
import ExportButtons from "./components/ExportButtons";
import ExpenseChart from "./components/ExpenseChart";
import Upload from "./components/Upload";
import "./index.css";
import Summary from "./components/Summary";
import TransactionsTable from "./components/TransactionsTable";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [summary, setSummary] = useState(null);
  const [category, setCategory] = useState("all");

  const handleUploadSuccess = ({ summary, transactions }) => {
    setTransactions(transactions);
    setSummary(summary);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesType =
      type === "all" ||
      (type === "credit" && tx.amount > 0) ||
      (type === "debit" && tx.amount < 0);

    const matchesCategory = category === "all" || tx.category === category;

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="container">
      <h1>🏦 Bank Statement Analyzer</h1>
      <Upload onUploadSuccess={handleUploadSuccess} />
      {summary && (
        <Summary
          totalCredit={summary.total_credit}
          totalDebit={summary.total_debit}
          netAmount={summary.net_balance}
        />
      )}

      {transactions.length > 0 && <ExpenseChart transactions={transactions} />}

      <Filters
        search={search}
        setSearch={setSearch}
        type={type}
        setType={setType}
        category={category}
        setCategory={setCategory}
      />

      <ExportButtons data={filteredTransactions} />

      <h2>Transactions</h2>
      {filteredTransactions?.length === 0 ? (
        <p>No transactions found. Upload a bank statement.</p>
      ) : (
        <TransactionsTable transactions={filteredTransactions} />
      )}
    </div>
  );
}

export default App;
