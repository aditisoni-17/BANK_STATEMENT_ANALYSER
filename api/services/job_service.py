import threading
import time
import uuid
from pathlib import Path
from typing import Dict, Optional

from api.services.bank_statement_service import BankStatementProcessingError, process_bank_statement
from api.services.logging_service import log_event

_jobs: Dict[str, Dict[str, object]] = {}
_lock = threading.Lock()


def create_job(user_id: str, filename: str, request_id: str) -> str:
    job_id = uuid.uuid4().hex
    now = int(time.time())

    with _lock:
        _jobs[job_id] = {
            "job_id": job_id,
            "request_id": request_id,
            "user_id": user_id,
            "filename": filename,
            "status": "queued",
            "transactions": [],
            "insights": {},
            "result": None,
            "error": None,
            "message": None,
            "created_at": now,
            "updated_at": now,
        }

    log_event("job_created", request_id=request_id, job_id=job_id, status="queued", filename=filename)
    return job_id


def get_job(job_id: str) -> Optional[Dict[str, object]]:
    with _lock:
        job = _jobs.get(job_id)
        return dict(job) if job else None


def _update_job(job_id: str, **updates) -> None:
    with _lock:
        job = _jobs.get(job_id)
        if not job:
            return
        job.update(updates)
        job["updated_at"] = int(time.time())


def build_job_response(job: Dict[str, object]) -> Dict[str, object]:
    return {
        "job_id": job.get("job_id"),
        "status": job.get("status"),
        "transactions": job.get("transactions") or [],
        "insights": job.get("insights") or {},
        "error": job.get("error"),
        "message": job.get("message") or (job.get("result") or {}).get("message"),
    }


def process_job(job_id: str, pdf_path: str) -> None:
    with _lock:
        job = _jobs.get(job_id)
        request_id = job.get("request_id") if job else None

    _update_job(job_id, status="processing")
    log_event("job_processing", request_id=request_id, job_id=job_id, status="processing")
    try:
        result = process_bank_statement(pdf_path)
        _update_job(
            job_id,
            status="completed",
            transactions=result.get("transactions", []),
            insights=result.get("insights", {}),
            result=result,
            error=None,
            message=result.get("message"),
        )
        log_event("job_completed", request_id=request_id, job_id=job_id, status="completed")
    except BankStatementProcessingError as error:
        _update_job(job_id, status="failed", error=str(error), transactions=[], insights={}, result=None, message=None)
        log_event("job_failed", request_id=request_id, job_id=job_id, status="failed", error=str(error))
    except Exception as error:
        _update_job(
            job_id,
            status="failed",
            error="Failed to process uploaded PDF",
            transactions=[],
            insights={},
            result=None,
            message=None,
        )
        log_event(
            "job_failed",
            request_id=request_id,
            job_id=job_id,
            status="failed",
            error=str(error) or "Failed to process uploaded PDF",
        )
    finally:
        try:
            Path(pdf_path).unlink(missing_ok=True)
        except Exception:
            pass
