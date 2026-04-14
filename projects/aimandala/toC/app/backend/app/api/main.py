"""Minimal FastAPI app for the first AI-Mandala To C backend migration slice."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes_v2 import router as router_v2


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI-Mandala To C Backend",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:4173",
            "http://localhost:4174",
            "http://127.0.0.1:4173",
            "http://127.0.0.1:4174",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://101.43.98.40",
            "https://101.43.98.40",
            "http://dev-web.jingshu.cc",
            "https://dev-web.jingshu.cc",
            "http://web.jingshu.cc",
            "https://web.jingshu.cc",
        ],
        allow_origin_regex=(
            r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"
            r"|https?://101\.43\.98\.40(:\d+)?$"
            r"|https?://([a-z0-9-]+\.)?jingshu\.cc$"
        ),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router_v2)

    @app.get("/health", tags=["system"])
    async def health():
        return {"status": "healthy", "version": "0.1.0", "service": "aimandala-toc-backend"}

    return app


app = create_app()
