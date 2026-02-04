import { useState } from "react";

function Upload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
  if (!file) {
    alert("Please select a PDF first");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    onUploadSuccess(data.transactions);
  } catch (err) {
    console.error(err);
    alert("Upload failed");
  }
};


  return (
    <div className="upload-box">
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {file && <p className="file-name">📄 {file.name}</p>}
      <button onClick={handleUpload}>Upload PDF</button>
    </div>
  );
}

export default Upload;
