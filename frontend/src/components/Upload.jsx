import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function Upload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF");
      setTransactions(null);
      return;
    }

    setLoading(true);
    setError("");
    setTransactions(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.detail || `Upload failed with status ${response.status}`
        );
      }

      if (payload?.success === false) {
        throw new Error(payload.message || "Upload failed");
      }

      const data = payload?.data || payload;

      if (!data || !Array.isArray(data.transactions)) {
        throw new Error("No parsed transaction data returned from the server");
      }

      onUploadSuccess(data);
      setTransactions(data.transactions);
    } catch (error) {
      setError(error.message || "Upload failed. Try again.");
      setTransactions(null);
    } finally {
      setLoading(false);
    }
  };

  const renderState = () => {
    if (loading) {
      return <p className="status-text">Uploading...</p>;
    }

    if (error) {
      return <p className="error">Error: {error}</p>;
    }

    if (transactions?.length === 0) {
      return <p className="status-text">No transactions found</p>;
    }

    if (transactions?.length > 0) {
      return (
        <div className="status-text">
          <p>Upload successful</p>
          <ul>
            {transactions.map((tx, index) => (
              <li key={index}>
                {tx.date} - {tx.description} - {tx.amount}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="upload-box">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
        disabled={loading}
      />
      {file && <p className="file-name">📄 {file.name}</p>}

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload PDF"}
      </button>

      {renderState()}
    </div>
  );
}

export default Upload;
