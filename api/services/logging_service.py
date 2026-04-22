import json
import logging
from typing import Any, Optional


logger = logging.getLogger("bank_statement_analyzer")


def _clean_fields(**fields: Any):
    return {key: value for key, value in fields.items() if value is not None}


def log_event(
    event: str,
    *,
    request_id: Optional[str] = None,
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    error: Optional[str] = None,
    **extra: Any,
) -> None:
    payload = _clean_fields(
        event=event,
        request_id=request_id,
        job_id=job_id,
        status=status,
        error=error,
        **extra,
    )
    logger.info(json.dumps(payload, default=str))
