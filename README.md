# Bank Statement Analyzer

A full-stack OCR-based application that extracts structured transactions from bank statement PDFs and visualizes expense insights in a React dashboard.

The system converts scanned or image-based PDF statements into text, cleans noisy OCR output, parses transaction fields, summarizes credits/debits, and displays the results in a frontend-friendly format.

## Features

- PDF upload and OCR extraction using Tesseract
- Image preprocessing with OpenCV for better OCR accuracy
- Regex-based transaction parsing for date, description, amount, and category
- Debit/credit summary generation
- React dashboard for viewing transactions
- Category-wise expense chart using Chart.js
- Deployment-ready FastAPI backend configuration for Render
- Environment-based frontend API configuration for Vercel

## Tech Stack

- Backend: Python, FastAPI, Uvicorn
- OCR: Tesseract, pdf2image, OpenCV, Pillow
- Parsing: Python regex-based parser
- Frontend: React, Vite, Chart.js
- Deployment: Render, Vercel

## Setup

### Backend

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Backend runs at:

```text
http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
```

Create a frontend `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

Run the app:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## API

Upload a PDF bank statement:

```text
POST /upload
```

Response includes parsed transactions and summary data:

```json
{
  "success": true,
  "data": {
    "transactions": [],
    "summary": {}
  }
}
```

## Live Demo

- Frontend: Add Vercel URL here
- Backend: Add Render URL here

## Notes

- OCR accuracy depends on PDF scan quality.
- The parser is designed for noisy OCR output but may require bank-specific tuning.
- For production, update CORS origins and `VITE_API_URL` with deployed URLs.
