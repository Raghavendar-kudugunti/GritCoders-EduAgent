import base64
import logging
import os
from functools import lru_cache

import jwt
from fastapi import HTTPException, Request
from jwt import PyJWKClient
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)


def _jwks_url() -> str:
    configured = os.getenv("CLERK_JWKS_URL")
    if configured:
        return configured
    # Vite-based Clerk setup stores the frontend key as VITE_CLERK_PUBLISHABLE_KEY.
    # The publishable key is safe to read server-side as well; keep the backend-specific
    # name as the preferred option for deployments that configure it separately.
    publishable_key = os.getenv("CLERK_PUBLISHABLE_KEY") or os.getenv(
        "VITE_CLERK_PUBLISHABLE_KEY", ""
    )
    try:
        encoded_host = publishable_key.split("_", 2)[2]
        host = base64.b64decode(
            encoded_host + "=" * (-len(encoded_host) % 4)
        ).decode().rstrip("$")
    except (IndexError, ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=503, detail="Clerk authentication is not configured")
    protocol = "http" if host.startswith("localhost") else "https"
    return f"{protocol}://{host}/.well-known/jwks.json"


@lru_cache(maxsize=4)
def _jwks_client(url: str) -> PyJWKClient:
    # Use PyJWT's default urllib transport so the backend honors the machine's
    # configured proxy when reaching Clerk's public JWKS endpoint.
    return PyJWKClient(url, cache_keys=True)


async def current_user_id(request: Request) -> str:
    token = request.headers.get("authorization", "")
    token = token.removeprefix("Bearer ").strip()
    token = token or request.cookies.get("__session", "")
    if not token:
        logger.warning("Clerk rejected %s: no session token was sent", request.url.path)
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        url = _jwks_url()
        key = (await run_in_threadpool(_jwks_client(url).get_signing_key_from_jwt, token)).key
        # Allow small clock drift between the local machine and Clerk's issuer.
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"verify_aud": False},
            leeway=60,
        )
        user_id = claims.get("sub") or claims.get("userId")
        if not isinstance(user_id, str) or not user_id:
            raise ValueError("Token has no user subject")
        return user_id
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(
            "Clerk rejected %s: token verification failed (%s: %s)",
            request.url.path,
            type(exc).__name__,
            str(exc),
        )
        raise HTTPException(status_code=401, detail="Unauthorized") from exc
