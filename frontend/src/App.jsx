import { useState } from "react";
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
  const [category, setCategory] = useState("all");
  const [rawText, setRawText] = useState("");
  const [cleanedText, setCleanedText] = useState("");
  const [view, setView] = useState("parsed");

  const handleUploadSuccess = ({
    summary,
    transactions,
    raw_text,
    cleaned_text,
  }) => {
    setTransactions(transactions);
    setSummary(summary);
    setRawText(raw_text);
    setCleanedText(cleaned_text);
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

      <div className="pipeline-status" aria-label="Pipeline status">
        <span>PDF</span>
        <span>→</span>
        <span>OCR</span>
        <span>→</span>
        <span>Clean</span>
        <span>→</span>
        <span>Parsed</span>
      </div>

      {summary && (
        <Summary
          totalCredit={summary.total_credit}
          totalDebit={summary.total_debit}
          netAmount={summary.net_balance}
        />
      )}

      <div className="view-tabs">
        <button onClick={() => setView("parsed")} disabled={view === "parsed"}>
          Parsed
        </button>
        <button onClick={() => setView("cleaned")} disabled={view === "cleaned"}>
          Cleaned
        </button>
        <button onClick={() => setView("raw")} disabled={view === "raw"}>
          Raw
        </button>
      </div>

      {view === "parsed" && (
        <>
          <div className="section-header">
            <h2>Parsed Transactions</h2>
            <p>Review extracted transactions, apply filters, and export results.</p>
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">
              <h3>No data yet</h3>
              <p>Upload a bank statement PDF to run the OCR pipeline.</p>
            </div>
          ) : (
            <>
              <Filters
                search={search}
                setSearch={setSearch}
                type={type}
                setType={setType}
                category={category}
                setCategory={setCategory}
              />

              <ExportButtons data={filteredTransactions} />

              {filteredTransactions.length === 0 ? (
                <div className="empty-state">
                  <h3>No matching transactions</h3>
                  <p>Try changing the search text or filter values.</p>
                </div>
              ) : (
                <TransactionsTable
                  transactions={filteredTransactions}
                  totalCount={transactions.length}
                />
              )}
            </>
          )}
        </>
      )}

      {view === "cleaned" && (
        <>
          <div className="section-header">
            <h2>Cleaned OCR Text</h2>
            <p>Normalized OCR output after cleanup and preprocessing.</p>
          </div>
          <pre className="text-panel">
            {cleanedText || "No cleaned OCR text available."}
          </pre>
        </>
      )}

      {view === "raw" && (
        <>
          <div className="section-header">
            <h2>Raw OCR Text</h2>
            <p>Direct OCR output before cleanup.</p>
          </div>
          <pre className="text-panel">
            {rawText || "No raw OCR text available."}
          </pre>
        </>
      )}
    </div>
  );
}

export default App;
