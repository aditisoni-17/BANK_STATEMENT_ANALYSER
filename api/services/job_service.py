import os
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, Optional

from api.services.bank_statement_service import BankStatementProcessingError, process_bank_statement

_jobs: Dict[str, Dict[str, object]] = {}
_lock = threading.Lock()


def create_job(user_id: str, filename: str) -> str:
    job_id = uuid.uuid4().hex
    now = int(time.time())

    with _lock:
        _jobs[job_id] = {
            "job_id": job_id,
            "user_id": user_id,
            "filename": filename,
            "status": "queued",
            "result": None,
            "error": None,
            "created_at": now,
            "updated_at": now,
        }

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


def process_job(job_id: str, pdf_path: str) -> None:
    _update_job(job_id, status="processing")
    try:
        result = process_bank_statement(pdf_path)
        _update_job(job_id, status="completed", result=result, error=None)
    except BankStatementProcessingError as error:
        _update_job(job_id, status="failed", error=str(error))
    except Exception:
        _update_job(job_id, status="failed", error="Failed to process uploaded PDF")
    finally:
        try:
            Path(pdf_path).unlink(missing_ok=True)
        except Exception:
            pass
