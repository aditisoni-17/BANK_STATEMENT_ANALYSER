from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os

from ocr.process_bank_statement import processBankStatement


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

    return processBankStatement(pdf_path)
