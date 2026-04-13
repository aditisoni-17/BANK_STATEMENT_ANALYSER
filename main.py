from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    if not file.filename:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "PDF file is required"},
        )

    if file.content_type != "application/pdf":
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Only PDF files are allowed"},
        )

    pdf_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(pdf_path, "wb") as f:
        f.write(await file.read())

    try:
        result = processBankStatement(pdf_path)

        if not result.get("transactions"):
            return {
                "success": True,
                "message": "No transactions found in the uploaded PDF",
                "data": result,
            }

        return {"success": True, "data": result}
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(error) or "Failed to process bank statement",
            },
        )
