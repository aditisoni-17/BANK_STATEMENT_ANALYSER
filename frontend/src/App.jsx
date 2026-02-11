import { useEffect, useState } from "react";
import Analytics from "./components/Analytics";
import Filters from "./components/Filters";
import ExportButtons from "./components/ExportButtons";
import Upload from "./components/Upload";
import "./index.css";
import Summary from "./components/Summary";
import TransactionsTable from "./components/TransactionsTable";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [summary, setSummary] = useState([]);
  const [category, setCategory] = useState("all");

  const handleUploadSuccess = (data) => {
    console.log("Backend", data[0]);
    setTransactions(data);
    setSummary(data.summary);
  };

  useEffect(() => {
    const dummy = transactions.filter((tx) => {
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

    console.log("dummy: ", dummy);

    setFilteredTransactions(dummy)
  }, [transactions]);

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
