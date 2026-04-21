import os
import tempfile
from pathlib import Path
from io import BytesIO

from PIL import Image, UnidentifiedImageError
from fastapi import BackgroundTasks, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from api.services.auth_service import get_current_user
from api.services.job_service import create_job, process_job

MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
PDF_SIGNATURE = b"%PDF-"
ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/bmp",
    "image/tiff",
}
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}


def _is_pdf_signature(file_bytes: bytes) -> bool:
    return file_bytes.startswith(PDF_SIGNATURE)


def _is_valid_image(file_bytes: bytes) -> bool:
    try:
        with Image.open(BytesIO(file_bytes)) as image:
            image.verify()
        return True
    except (UnidentifiedImageError, OSError, ValueError):
        return False


async def handle_upload(file: UploadFile, request: Request, background_tasks: BackgroundTasks):
    try:
        user = get_current_user(request)
    except HTTPException as error:
        return JSONResponse(
            status_code=error.status_code,
            content={"success": False, "message": error.detail},
        )
    except Exception as error:
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": str(error)},
        )

    if not file or not file.filename:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "PDF file is required"},
        )

    suffix = Path(file.filename).suffix.lower()
    is_pdf_type = file.content_type in {"application/pdf", "application/octet-stream"} or suffix == ".pdf"
    is_image_type = file.content_type in ALLOWED_IMAGE_CONTENT_TYPES or suffix in IMAGE_SUFFIXES

    if not (is_pdf_type or is_image_type):
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Only PDF or image files are allowed"},
        )

    file_bytes = await file.read(MAX_UPLOAD_SIZE_BYTES + 1)
    if not file_bytes:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Uploaded file is empty"},
        )

    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        return JSONResponse(
            status_code=413,
            content={"success": False, "message": "File size must be 5MB or less"},
        )

    if is_pdf_type and not _is_pdf_signature(file_bytes):
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Uploaded file is not a valid PDF"},
        )

    if is_image_type and not _is_valid_image(file_bytes):
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Uploaded file is not a valid image"},
        )

    temp_path = None
    try:
        suffix = Path(file.filename).suffix or (".pdf" if is_pdf_type else ".png")
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            temp_path = tmp.name

        job_id = create_job(user["id"], file.filename)
        background_tasks.add_task(process_job, job_id, temp_path)

        return JSONResponse(
            status_code=202,
            content={
                "success": True,
                "job_id": job_id,
                "status": "queued",
                "message": "File accepted for processing",
            },
        )
    except Exception as error:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(error) or "Failed to queue bank statement processing",
            },
        )
