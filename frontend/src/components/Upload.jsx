import { useState } from "react";
import { navigateTo } from "../router";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function Upload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF");
      setStatus("");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file");
      setStatus("");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("File size must be 5MB or less");
      setStatus("");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        credentials: "include",
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

      if (!payload?.job_id && !data?.job_id) {
        throw new Error("No job ID returned from the server");
      }

      localStorage.removeItem("analysis");
      localStorage.setItem("analysisJobId", payload.job_id || data.job_id);
      onUploadSuccess(payload);
      setStatus("Upload queued for processing");
      navigateTo("/processing");
    } catch (error) {
      setError(error.message || "Upload failed. Try again.");
      setStatus("");
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

    if (status) {
      return <p className="status-text">{status}</p>;
    }

    return null;
  };

  return (
    <div className="upload-box">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
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
