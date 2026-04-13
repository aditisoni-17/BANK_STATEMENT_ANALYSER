import { useState } from "react";

function Upload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
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
    } catch (error) {
      setError(error.message || "Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
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
        {loading ? "Processing..." : "Upload PDF"}
      </button>

      {loading && <p className="status-text">Extracting transactions from PDF...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Upload;
