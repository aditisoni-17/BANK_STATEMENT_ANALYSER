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
    console.log("form: ", formData);
    formData.append("file", file);
    console.log("object");

    try {
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      console.log("Form data: ", formData);
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      console.log("ob");

      const data = await response.json();
      console.log("Data coming: ", data);
      onUploadSuccess(data.transactions);
    } catch (error) {
      console.error(error);
      setError("Upload failed. Try again.");
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
      />
      {file && <p className="file-name">📄 {file.name}</p>}

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Processing..." : "Upload PDF"}
      </button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Upload;
