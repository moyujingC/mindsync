"""
Temporary no-op rate limiter for the first migration slice.

This keeps the API surface compatible with the old V2 code without
bringing the full slowapi integration into the first batch.
"""

from fastapi.responses import JSONResponse


class RateLimitConfig:
    """Rate limit configuration placeholder."""

    STORAGE_BACKEND = "memory"
    REDIS_URL = "redis://localhost:6379/0"
    ENABLED = False
    DEBUG = False
    WHITELIST = []
    BLACKLIST = []


def _noop(func):
    return func


def upload_endpoint_limit():
    return _noop


def upgrade_endpoint_limit():
    return _noop


def chat_endpoint_limit():
    return _noop


def detect_circles_limit():
    return _noop


def query_endpoint_limit():
    return _noop


def report_endpoint_limit():
    return _noop


def progress_endpoint_limit():
    return _noop


def health_endpoint_limit():
    return _noop


def debug_endpoint_limit():
    return _noop


def pricing_endpoint_limit():
    return _noop


class FakeLimiter:
    """Compatibility shim for slowapi limiter."""

    def limit(self, *args, **kwargs):
        return _noop


limiter = FakeLimiter()


class SlowAPIMiddleware:
    """Compatibility shim for slowapi middleware."""

    pass


def rate_limit_exceeded_handler(*args, **kwargs):
    return JSONResponse(status_code=429, content={"error": "Rate limit"})
