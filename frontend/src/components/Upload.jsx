import { useMemo, useRef, useState } from "react";
import { apiRequest } from "../auth";
import { navigateTo } from "../router";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"];

function getFileExtension(name = "") {
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "";
}

function isSupportedFile(file) {
  const extension = getFileExtension(file?.name || "");
  return ACCEPTED_EXTENSIONS.includes(extension) || file?.type === "application/pdf" || file?.type?.startsWith("image/");
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Upload({ onUploadSuccess }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const supportedFormats = useMemo(() => ["PDF", "PNG", "JPG", "JPEG", "WEBP"], []);

  const clearMessages = () => {
    setError("");
    setStatus("");
  };

  const handleSelectFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!isSupportedFile(selectedFile)) {
      setError("Please upload a PDF or image file");
      setStatus("");
      return;
    }

    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      setError("File size must be 5MB or less");
      setStatus("");
      return;
    }

    setFile(selectedFile);
    clearMessages();
  };

  const handleFileInput = (event) => {
    handleSelectFile(event.target.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!loading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleSelectFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF or image file");
      setStatus("");
      return;
    }

    setLoading(true);
    clearMessages();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const payload = await apiRequest("/upload", {
        method: "POST",
        body: formData,
      });

      const jobId = payload?.job_id || payload?.data?.job_id;
      if (!jobId) {
        throw new Error("No job ID returned from the server");
      }

      localStorage.setItem("analysisJobId", jobId);
      onUploadSuccess?.(payload);
      setStatus("Upload queued for processing");
      navigateTo("/processing");
    } catch (uploadError) {
      if (uploadError?.status === 401) {
        return;
      }

      setError(uploadError.message || "Upload failed. Try again.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-shell">
      <div className="upload-card">
        <div className="upload-header">
          <p className="upload-eyebrow">Bank statement upload</p>
          <h2>Upload your statement</h2>
          <p>
            Drop a PDF or image of your bank statement and we will analyze it securely.
          </p>
        </div>

        <div
          className={`upload-dropzone ${isDragging ? "drag-active" : ""} ${loading ? "is-disabled" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === " ") && !loading) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff"
            onChange={handleFileInput}
            disabled={loading}
            className="upload-input"
          />

          <div className="upload-icon">⬆</div>
          <p className="upload-title">{isDragging ? "Drop your file here" : "Drag and drop or click to browse"}</p>
          <p className="upload-subtitle">
            Supports PDF and common image formats
          </p>
        </div>

        {file && (
          <div className="upload-file-row">
            <div>
              <p className="upload-file-name">{file.name}</p>
              <p className="upload-file-meta">
                {formatFileSize(file.size)} • {file.type || "unknown type"}
              </p>
            </div>
            <button
              type="button"
              className="upload-clear-button"
              onClick={() => {
                setFile(null);
                clearMessages();
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
              disabled={loading}
            >
              Remove
            </button>
          </div>
        )}

        <div className="upload-actions">
          <button type="button" className="upload-primary-button" onClick={handleUpload} disabled={loading}>
            {loading ? "Uploading..." : "Analyze statement"}
          </button>
        </div>

        <div className="upload-support">
          {supportedFormats.map((format) => (
            <span key={format}>{format}</span>
          ))}
        </div>

        {loading && <p className="status-text">Uploading...</p>}
        {!loading && error && <p className="error">Error: {error}</p>}
        {!loading && status && <p className="status-text">{status}</p>}
      </div>
    </div>
  );
}

export default Upload;
