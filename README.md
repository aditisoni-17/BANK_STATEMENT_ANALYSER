# 🏦 Bank Statement Analyzer (OCR-based)

## 📌 Overview

This project extracts **structured transaction data** from **scanned bank statement PDFs** using **OCR (Optical Character Recognition)**.

👉 It converts **unstructured scanned PDFs** into **machine-readable JSON**, handling real-world OCR noise like:

* broken text
* spaced numbers (e.g. `15 000.00`)
* inconsistent formats

This is **not a tutorial-style project**, but a **real OCR pipeline** inspired by production-grade systems.

---

## ⚙️ Tech Stack

* Python
* Tesseract OCR
* OpenCV
* pdf2image
* NumPy
* Regex-based parsing
* Git / GitHub

---

## 🔁 Pipeline Flow

```
PDF
 → Image (pdf2image)
 → Preprocessing (OpenCV)
 → OCR (Tesseract)
 → Text Cleaning
 → OCR-aware Parsing
 → Debit / Credit Detection
 → JSON Output
```

---

## 🧠 Key Features

* ✅ Handles **scanned PDFs** (image-based, not selectable text)
* ✅ OCR-aware parsing (dates, spaced amounts, noisy text)
* ✅ Debit / Credit detection using transaction direction
* ✅ Configurable account holder (no hard-coding)
* ✅ Clean, frontend-ready `output.json`

---

## 📂 Project Structure

```
backend/
│
├── ocr/
│   ├── pdf_to_image.py
│   ├── preprocess.py
│   ├── ocr_engine.py
│   ├── clean_text.py
│   ├── parser.py
│   ├── config.py
│   └── output.json
│
├── sample_files/
│   └── statement.pdf
│
├── requirements.txt
└── README.md
```

---

## ▶️ How to Run

### 1️⃣ Create virtual environment

```
python3 -m venv venv
source venv/bin/activate
```

### 2️⃣ Install dependencies

```
pip install -r requirements.txt
```

### 3️⃣ Add scanned PDF

Place your **scanned bank statement** here:

```
backend/sample_files/statement.pdf
```

> ⚠️ The PDF must be **image-based** (scanned or photographed). Text-selectable PDFs will not reflect real OCR behavior.

### 4️⃣ Run OCR pipeline

```
python ocr/run_ocr.py
```

---

## 📄 Output

The final structured output is saved as:

```
ocr/output.json
```

### Example Output

```
[
  {
    "date": "18/12/2025",
    "description": "UPI/... FROM JYOTI-KHAN ... TO NSACHDEV ...",
    "amount": 15000.0
  },
  {
    "date": "17/12/2025",
    "description": "UPI/... TO BLINKIT ...",
    "amount": -23.0
  }
]
```

---

## ⚠️ Limitations

* OCR accuracy depends heavily on **scan quality**
* Transactions may be skipped if text is **partially unreadable**
* The system performs **best-effort extraction**, not guaranteed 100% accuracy

> These limitations closely reflect **real-world OCR systems**.

---

## 💡 What I Learned

* OCR output is **inherently noisy and unpredictable**
* Parsing logic must be **tolerant, not strict**
* Real engineering involves **debugging messy data**, not just writing regex
* Clean architecture and **config abstraction improve scalability**

---

## 🚀 Future Improvements

* Improved **table detection** for complex layouts
* **Confidence scoring** per extracted transaction
* Interactive **React dashboard** for analysis & visualization
* Bank-specific parsing rules for **higher accuracy**
