# 腾讯云部署说明（systemd + nginx / Docker + nginx）

> 适用范围：`AI-Mandala To C` 当前迁移期后端（FastAPI）与 mobile-web 静态前端

当前项目已经形成两种部署路径：

- 开发测试机：`systemd + nginx`
- 正式发布机：`Docker + nginx`

本目录保留宿主机直跑样例：

- `aimandala-backend.service.example`
- `aimandala-api.nginx.conf.example`

正式机当前已经改走 Docker 发布，请优先参考：

- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/docker/README.md`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/docker/docker-compose.release.yml`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/docker/aimandala-release.nginx.conf.example`

当前线上正式域名：

- `https://web.jingshu.cc`
- `https://web-api.jingshu.cc/health`

使用方式：

1. 复制 `.example` 文件并按你的机器路径、域名、证书路径替换占位符。
2. 后端建议放在固定目录（例如 `/opt/aimandala/backend`）。
3. systemd 加载服务后，再由 nginx 反代 `127.0.0.1:8000`。

注意：

- 当前样例默认你已经准备好 Python 运行环境（例如 `venv`）和应用代码。
- 样例没有覆盖高可用、滚动发布、WAF、灰度发布，仅用于“先上线可用”。
- 当前正式机 TLS 已经由宿主机 `certbot + nginx` 接管。
- 如果前端要在正式域名下工作，构建时的 API 基地址必须使用 `https://web-api.jingshu.cc`。
