import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request, status

_requests: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)
_lock = threading.Lock()


def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client and request.client.host:
        return request.client.host

    return "unknown"


def enforce_rate_limit(scope: str, limit: int, window_seconds: int):
    async def dependency(request: Request):
        client_key = (_get_client_ip(request), scope)
        now = time.time()
        cutoff = now - window_seconds

        with _lock:
            bucket = _requests[client_key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()

            if len(bucket) >= limit:
                retry_after = max(1, int(window_seconds - (now - bucket[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests for {scope}. Please try again later.",
                    headers={"Retry-After": str(retry_after)},
                )

            bucket.append(now)

    return dependency
