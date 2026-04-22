import re

from pydantic import BaseModel, Field
from fastapi import Request, Response
from fastapi.responses import JSONResponse

from api.services.auth_service import (
    AuthError,
    clear_csrf_cookie,
    clear_auth_cookie,
    create_session,
    get_current_user,
    login_user,
    logout_user,
    issue_csrf_token,
    set_csrf_cookie,
    set_auth_cookie,
    signup_user,
    validate_csrf_token,
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


async def handle_csrf(response: Response):
    token = issue_csrf_token()
    set_csrf_cookie(response, token)
    return {"success": True, "csrf_token": token}


async def handle_signup(payload: SignupPayload, request: Request, response: Response):
    try:
        validate_csrf_token(request)
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
    except Exception as error:
        return JSONResponse(
            status_code=403,
            content={"success": False, "message": str(error)},
        )


async def handle_login(payload: LoginPayload, request: Request, response: Response):
    try:
        validate_csrf_token(request)
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
    except Exception as error:
        return JSONResponse(
            status_code=403,
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
    validate_csrf_token(request)
    logout_user(request)
    clear_auth_cookie(response)
    clear_csrf_cookie(response)
    return {"success": True}
