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

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || `Upload failed with status ${response.status}`);
      }

      onUploadSuccess(data);
    } catch (error) {
      setError(error.message || "Upload failed");
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

      {loading && <p className="status-text">Processing...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Upload;
