from fastapi import APIRouter, Request, Response

from api.controllers.auth_controller import (
    LoginPayload,
    SignupPayload,
    handle_login,
    handle_logout,
    handle_me,
    handle_signup,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
async def signup(payload: SignupPayload, response: Response):
    return await handle_signup(payload, response)


@router.post("/login")
async def login(payload: LoginPayload, response: Response):
    return await handle_login(payload, response)


@router.get("/me")
async def me(request: Request):
    return await handle_me(request)


@router.post("/logout")
async def logout(request: Request, response: Response):
    return await handle_logout(request, response)
