from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from api.services.auth_service import get_current_user
from api.services.job_service import build_job_response, get_job
from api.services.logging_service import log_event


async def handle_job_status(job_id: str, request: Request):
    request_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID")
    try:
        current_user = get_current_user(request)
        job = get_job(job_id)

        if not job:
            log_event("job_lookup_failed", request_id=request_id, job_id=job_id, status="failed", error="Job not found")
            return JSONResponse(
                status_code=404,
                content={
                    "job_id": job_id,
                    "status": "failed",
                    "transactions": [],
                    "insights": {},
                    "error": "Job not found",
                },
            )

        if job.get("user_id") != current_user["id"]:
            log_event(
                "job_access_denied",
                request_id=request_id,
                job_id=job_id,
                status="failed",
                error="You do not have access to this job",
            )
            return JSONResponse(
                status_code=403,
                content={
                    "job_id": job_id,
                    "status": "failed",
                    "transactions": [],
                    "insights": {},
                    "error": "You do not have access to this job",
                },
            )

        response = build_job_response(job)
        log_event(
            "job_status_read",
            request_id=request_id,
            job_id=job_id,
            status=response["status"],
            error=response["error"],
        )
        return response
    except HTTPException as error:
        log_event("job_lookup_failed", request_id=request_id, job_id=job_id, status="failed", error=str(error.detail))
        return JSONResponse(
            status_code=error.status_code,
            content={
                "job_id": job_id,
                "status": "failed",
                "transactions": [],
                "insights": {},
                "error": error.detail,
            },
        )
    except Exception as error:
        log_event("job_lookup_failed", request_id=request_id, job_id=job_id, status="failed", error=str(error))
        return JSONResponse(
            status_code=500,
            content={
                "job_id": job_id,
                "status": "failed",
                "transactions": [],
                "insights": {},
                "error": str(error) or "Failed to read job status",
            },
        )
