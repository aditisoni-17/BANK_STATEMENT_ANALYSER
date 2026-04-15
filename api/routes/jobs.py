from fastapi import APIRouter, Request

from api.controllers.job_controller import handle_job_status


router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}")
async def get_status(job_id: str, request: Request):
    return await handle_job_status(job_id, request)
