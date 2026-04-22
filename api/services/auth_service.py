import base64
import hashlib
import hmac
import json
import os
import secrets
import threading
import time
import uuid
from typing import Dict, Optional

from fastapi import HTTPException, Request, Response, status

AUTH_COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME", "bsta_auth")
AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "change-me-in-production")
AUTH_TOKEN_TTL_SECONDS = int(os.getenv("AUTH_TOKEN_TTL_SECONDS", "86400"))
CSRF_COOKIE_NAME = os.getenv("CSRF_COOKIE_NAME", "bsta_csrf")
CSRF_HEADER_NAME = os.getenv("CSRF_HEADER_NAME", "X-CSRF-Token")


def _resolve_cookie_settings():
    environment = os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "")).lower()

    same_site = os.getenv("AUTH_COOKIE_SAMESITE")
    if same_site:
        same_site = same_site.lower()
    elif environment == "production":
        same_site = "none"
    else:
        same_site = "lax"

    secure = os.getenv("AUTH_COOKIE_SECURE")
    if secure is None:
        secure_enabled = environment == "production" or same_site == "none"
    else:
        secure_enabled = secure.lower() == "true"

    return same_site, secure_enabled


AUTH_COOKIE_SAMESITE, AUTH_COOKIE_SECURE = _resolve_cookie_settings()
CSRF_COOKIE_SAMESITE = AUTH_COOKIE_SAMESITE
CSRF_COOKIE_SECURE = AUTH_COOKIE_SECURE

_users_by_email: Dict[str, Dict[str, str]] = {}
_tokens_by_jti: Dict[str, Dict[str, str]] = {}
_lock = threading.Lock()


class AuthError(Exception):
    pass


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _hash_password(password: str, salt: Optional[str] = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        120_000,
    ).hex()
    return f"{salt}${digest}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, digest = stored_hash.split("$", 1)
    except ValueError:
        return False

    expected = _hash_password(password, salt)
    return hmac.compare_digest(expected, stored_hash)


def _sign_payload(payload: dict) -> str:
    payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")
    signature = hmac.new(
        AUTH_SECRET_KEY.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded_payload}.{signature}"


def _decode_payload(token: str) -> dict:
    try:
        encoded_payload, signature = token.rsplit(".", 1)
    except ValueError as exc:
        raise AuthError("Invalid authentication token") from exc

    expected_signature = hmac.new(
        AUTH_SECRET_KEY.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_signature):
        raise AuthError("Invalid authentication token")

    padding = "=" * (-len(encoded_payload) % 4)
    try:
        payload_bytes = base64.urlsafe_b64decode(f"{encoded_payload}{padding}".encode("utf-8"))
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception as exc:
        raise AuthError("Invalid authentication token") from exc

    if float(payload.get("exp", 0)) < time.time():
        raise AuthError("Authentication token has expired")

    return payload


def _public_user(user: Dict[str, str]) -> Dict[str, str]:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
    }


def _issue_token(user: Dict[str, str]) -> str:
    now = int(time.time())
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "iat": now,
        "exp": now + AUTH_TOKEN_TTL_SECONDS,
        "jti": uuid.uuid4().hex,
    }

    token = _sign_payload(payload)
    with _lock:
        _tokens_by_jti[payload["jti"]] = {
            "user_id": user["id"],
            "email": user["email"],
            "name": user["name"],
        }
    return token


def _current_user_from_token(token: str) -> Dict[str, str]:
    payload = _decode_payload(token)
    jti = payload.get("jti")

    with _lock:
        session = _tokens_by_jti.get(jti)

    if not session or session.get("email") != payload.get("email"):
        raise AuthError("Session is no longer valid")

    with _lock:
        user = _users_by_email.get(_normalize_email(payload.get("email", "")))

    if not user or user["id"] != payload.get("sub"):
        raise AuthError("Session is no longer valid")

    return _public_user(user)


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        max_age=AUTH_TOKEN_TTL_SECONDS,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
    )


def set_csrf_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=CSRF_COOKIE_SECURE,
        samesite=CSRF_COOKIE_SAMESITE,
        max_age=AUTH_TOKEN_TTL_SECONDS,
        path="/",
    )


def clear_csrf_cookie(response: Response) -> None:
    response.delete_cookie(
        key=CSRF_COOKIE_NAME,
        path="/",
        secure=CSRF_COOKIE_SECURE,
        samesite=CSRF_COOKIE_SAMESITE,
    )


def issue_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def validate_csrf_token(request: Request) -> None:
    header_token = request.headers.get(CSRF_HEADER_NAME)
    cookie_token = request.cookies.get(CSRF_COOKIE_NAME)

    if not header_token or not cookie_token or header_token != cookie_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing CSRF token",
        )


def signup_user(name: str, email: str, password: str) -> Dict[str, str]:
    normalized_email = _normalize_email(email)
    if not name or not name.strip():
        raise AuthError("Name is required")
    if not normalized_email:
        raise AuthError("Email is required")
    if not password:
        raise AuthError("Password is required")

    with _lock:
        if normalized_email in _users_by_email:
            raise AuthError("An account with this email already exists")

        user = {
            "id": uuid.uuid4().hex,
            "name": name.strip(),
            "email": normalized_email,
            "password_hash": _hash_password(password),
            "created_at": str(int(time.time())),
        }
        _users_by_email[normalized_email] = user

    return _public_user(user)


def login_user(email: str, password: str) -> Dict[str, str]:
    normalized_email = _normalize_email(email)
    if not normalized_email or not password:
        raise AuthError("Email and password are required")

    with _lock:
        user = _users_by_email.get(normalized_email)

    if not user or not _verify_password(password, user["password_hash"]):
        raise AuthError("Invalid email or password")

    return _public_user(user)


def create_session(user: Dict[str, str]) -> str:
    with _lock:
        stored_user = _users_by_email.get(_normalize_email(user["email"]))

    if not stored_user:
        raise AuthError("Unable to create session")

    return _issue_token(stored_user)


def get_current_user(request: Request) -> Dict[str, str]:
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        return _current_user_from_token(token)
    except AuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


def logout_user(request: Request) -> None:
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        return

    try:
        payload = _decode_payload(token)
    except AuthError:
        return

    jti = payload.get("jti")
    with _lock:
        _tokens_by_jti.pop(jti, None)
