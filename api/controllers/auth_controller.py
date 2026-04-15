import re

from pydantic import BaseModel, Field
from fastapi import Request, Response
from fastapi.responses import JSONResponse

from api.services.auth_service import (
    AuthError,
    clear_auth_cookie,
    get_current_user,
    login_user,
    logout_user,
    set_auth_cookie,
    signup_user,
)


class SignupPayload(BaseModel):
    name: str = Field(min_length=2)
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


class LoginPayload(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


def _is_valid_email(value: str) -> bool:
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", value or ""))


async def handle_signup(payload: SignupPayload, response: Response):
    try:
        if not _is_valid_email(payload.email):
            raise AuthError("Please enter a valid email")
        user = signup_user(payload.name, payload.email, payload.password)
        clear_auth_cookie(response)
        return {"success": True, "user": user}
    except AuthError as error:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": str(error)},
        )


async def handle_login(payload: LoginPayload, response: Response):
    try:
        if not _is_valid_email(payload.email):
            raise AuthError("Please enter a valid email")
        user = login_user(payload.email, payload.password)
        token = create_session(user)
        set_auth_cookie(response, token)
        return {"success": True, "user": user}
    except AuthError as error:
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": str(error)},
        )


async def handle_me(request: Request):
    try:
        user = get_current_user(request)
        return {"success": True, "user": user}
    except Exception as error:
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": str(error)},
        )


async def handle_logout(request: Request, response: Response):
    logout_user(request)
    clear_auth_cookie(response)
    return {"success": True}
