import os
import logging
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.auth import router as auth_router
from api.routes.jobs import router as jobs_router
from api.routes.upload import router as upload_router


def _get_allowed_origins():
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = FastAPI(title="Bank Statement Analyzer API")

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(message)s")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request, call_next):
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.get("/")
def root():
    return {"status": "Bank Statement Analyzer API running"}


app.include_router(upload_router)
app.include_router(auth_router)
app.include_router(jobs_router)
