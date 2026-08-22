"""第 36 课后端入口。"""

from __future__ import annotations

import uvicorn

from api.routes import app


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
