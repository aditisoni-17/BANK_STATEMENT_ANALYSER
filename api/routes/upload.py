from fastapi import APIRouter, BackgroundTasks, Depends, File, Request, UploadFile

from api.controllers.upload_controller import handle_upload
from api.services.rate_limit_service import enforce_rate_limit


router = APIRouter()


@router.post("/upload", dependencies=[Depends(enforce_rate_limit("upload", 10, 3600))])
async def upload(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    return await handle_upload(file, request, background_tasks)
