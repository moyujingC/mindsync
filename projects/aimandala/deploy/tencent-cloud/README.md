# 腾讯云单机部署样例（systemd + nginx）

> 适用范围：`AI-Mandala To C` 当前迁移期后端（FastAPI）与 mobile-web 静态前端

本目录提供最小可执行样例：

- `aimandala-backend.service.example`
- `aimandala-api.nginx.conf.example`

如果后续正式机改走 Docker 发布，而不是宿主机直接运行 `uvicorn`，请优先参考：

- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/docker/README.md`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/docker/docker-compose.release.yml`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/docker/aimandala-release.nginx.conf.example`

使用方式：

1. 复制 `.example` 文件并按你的机器路径、域名、证书路径替换占位符。
2. 后端建议放在固定目录（例如 `/opt/aimandala/backend`）。
3. systemd 加载服务后，再由 nginx 反代 `127.0.0.1:8000`。

注意：

- 当前样例默认你已经准备好 Python 运行环境（例如 `venv`）和应用代码。
- 样例没有覆盖高可用、滚动发布、WAF、灰度发布，仅用于“先上线可用”。
