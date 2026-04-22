from fastapi import APIRouter, Depends, Request, Response

from api.controllers.auth_controller import (
    LoginPayload,
    SignupPayload,
    handle_csrf,
    handle_login,
    handle_logout,
    handle_me,
    handle_signup,
)
from api.services.rate_limit_service import enforce_rate_limit


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/csrf")
async def csrf(response: Response):
    return await handle_csrf(response)


@router.post("/signup", dependencies=[Depends(enforce_rate_limit("auth_signup", 5, 900))])
async def signup(payload: SignupPayload, request: Request, response: Response):
    return await handle_signup(payload, request, response)


@router.post("/login", dependencies=[Depends(enforce_rate_limit("auth_login", 5, 900))])
async def login(payload: LoginPayload, request: Request, response: Response):
    return await handle_login(payload, request, response)


@router.get("/me")
async def me(request: Request):
    return await handle_me(request)


@router.post("/logout")
async def logout(request: Request, response: Response):
    return await handle_logout(request, response)
