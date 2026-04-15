from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from api.services.auth_service import get_current_user
from api.services.job_service import get_job


async def handle_job_status(job_id: str, request: Request):
    try:
        current_user = get_current_user(request)
        job = get_job(job_id)

        if not job:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Job not found"},
            )

        if job.get("user_id") != current_user["id"]:
            return JSONResponse(
                status_code=403,
                content={"success": False, "message": "You do not have access to this job"},
            )

        return {"success": True, "data": job}
    except HTTPException as error:
        return JSONResponse(
            status_code=error.status_code,
            content={"success": False, "message": error.detail},
        )
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(error) or "Failed to read job status"},
        )
