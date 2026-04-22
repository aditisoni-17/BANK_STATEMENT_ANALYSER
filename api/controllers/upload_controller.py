import os
import tempfile
from pathlib import Path

from fastapi import BackgroundTasks, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from api.services.auth_service import get_current_user
from api.services.logging_service import log_event
from api.services.job_service import create_job, process_job

MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
PDF_SIGNATURE = b"%PDF-"


def _is_pdf_signature(file_bytes: bytes) -> bool:
    return file_bytes.startswith(PDF_SIGNATURE)


async def handle_upload(file: UploadFile, request: Request, background_tasks: BackgroundTasks):
    request_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID")

    try:
        user = get_current_user(request)
    except HTTPException as error:
        log_event("upload_unauthorized", request_id=request_id, status="failed", error=str(error.detail))
        return JSONResponse(
            status_code=error.status_code,
            content={
                "job_id": None,
                "status": "failed",
                "transactions": [],
                "insights": {},
                "error": error.detail,
            },
        )
    except Exception as error:
        log_event("upload_unauthorized", request_id=request_id, status="failed", error=str(error))
        return JSONResponse(
            status_code=401,
            content={
                "job_id": None,
                "status": "failed",
                "transactions": [],
                "insights": {},
                "error": str(error),
            },
        )

    if not file or not file.filename:
        log_event("upload_validation_failed", request_id=request_id, status="failed", error="PDF file is required")
        return JSONResponse(
            status_code=400,
            content={
                "job_id": None,
                "status": "failed",
                "transactions": [],
                "insights": {},
                "error": "PDF file is required",
            },
        )

    suffix = Path(file.filename).suffix.lower()
    is_pdf_type = file.content_type in {"application/pdf", "application/octet-stream"} or suffix == ".pdf"

    if not is_pdf_type:
        log_event(
            "upload_validation_failed",
            request_id=request_id,
            status="failed",
            error="Only PDF files are allowed",
        )
        return JSONResponse(
            status_code=400,
            content={
                "job_id": None,
                "status": "failed",
                "transactions": [],
                "insights": {},
                "error": "Only PDF files are allowed",
            },
        )

    file_bytes = await file.read(MAX_UPLOAD_SIZE_BYTES + 1)
    if not file_bytes:
        log_event("upload_validation_failed", request_id=request_id, status="failed", error="Uploaded file is empty")
        return JSONResponse(
            status_code=400,
            content={
                "job_id": None,
                "status": "failed",
                "transactions": [],
                "insights": {},
                "error": "Uploaded file is empty",
            },
        )

    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        log_event("upload_validation_failed", request_id=request_id, status="failed", error="File size must be 5MB or less")
        return JSONResponse(
            status_code=413,
            content={
                "job_id": None,
                "status": "failed",
                "transactions": [],
                "insights": {},
                "error": "File size must be 5MB or less",
            },
        )

    if not _is_pdf_signature(file_bytes):
        log_event(
            "upload_validation_failed",
            request_id=request_id,
            status="failed",
            error="Uploaded file is not a valid PDF",
        )
        return JSONResponse(
            status_code=400,
            content={
                "job_id": None,
                "status": "failed",
                "transactions": [],
                "insights": {},
                "error": "Uploaded file is not a valid PDF",
            },
        )

    temp_path = None
    try:
        suffix = Path(file.filename).suffix or ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            temp_path = tmp.name

        job_id = create_job(user["id"], file.filename, request_id or "")
        background_tasks.add_task(process_job, job_id, temp_path)
        log_event("upload_accepted", request_id=request_id, job_id=job_id, status="queued")

        return JSONResponse(
            status_code=202,
            content={
                "job_id": job_id,
                "status": "queued",
                "transactions": [],
                "insights": {},
                "error": None,
            },
        )
    except Exception as error:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        log_event("upload_failed", request_id=request_id, status="failed", error=str(error))
        return JSONResponse(
            status_code=500,
            content={
                "job_id": None,
                "status": "failed",
                "transactions": [],
                "insights": {},
                "error": str(error) or "Failed to queue bank statement processing",
            },
        )
