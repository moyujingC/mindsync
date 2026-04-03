"""Minimal FastAPI app for the first AI-Mandala To C backend migration slice."""

from fastapi import FastAPI

from .routes_v2 import router as router_v2


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI-Mandala To C Backend",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.include_router(router_v2)

    @app.get("/health", tags=["system"])
    async def health():
        return {"status": "healthy", "version": "0.1.0", "service": "aimandala-toc-backend"}

    return app


app = create_app()
