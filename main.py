from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
import os

from ocr.pdf_to_image import pdf_to_images
from ocr.preprocess import preprocess_image
from ocr.ocr_engine import extract_text
from ocr.clean_text import clean_text
from ocr.parser import parse_transactions
from ocr.summary import calculate_summary


app = FastAPI()


@app.get("/")
def root():
    return {"status": "Bank Statement Analyzer API running"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-frontend.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    pdf_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(pdf_path, "wb") as f:
        f.write(await file.read())

    images = pdf_to_images(pdf_path)
    print("Img: ", images)

    full_text = ""
    for img in images:
        processed = preprocess_image(img)
        print("Process", processed)
        text = extract_text(processed)
        # print("text: ", text)
        full_text += text + "\n"
        # print("full: ", full_text)

    print("Full text: ", full_text)
    cleaned = clean_text(full_text)
    print("Cleaned: ", cleaned)
    transactions = parse_transactions(cleaned)
    print("Transactions: ", transactions)

    return {
        "summary": calculate_summary(transactions),
        "transactions": transactions
    }
