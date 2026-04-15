from fastapi import APIRouter, BackgroundTasks, File, Request, UploadFile

from api.controllers.upload_controller import handle_upload


router = APIRouter()


@router.post("/upload")
async def upload(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    return await handle_upload(file, request, background_tasks)
