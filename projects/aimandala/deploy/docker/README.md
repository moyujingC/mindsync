# AIMandala Release Docker 骨架

> 适用范围：`aimandala` 新版 `release` 并行部署

本目录用于为正式机上的新版 `aimandala` 提供 Docker 发布骨架，目标不是立刻替换当前线上旧容器，而是先并行跑起新版 `release`，再通过宿主机 `nginx` 平滑切流量。

## 当前建议结构

- `backend.Dockerfile`
  - 打包 To C backend
- `frontend.Dockerfile`
  - build mobile-web 并用 `nginx` 提供静态页
- `docker-compose.release.yml`
  - 同时拉起 backend / frontend 两个容器
- `.env.release.example`
  - release 环境变量模板
- `aimandala-release.nginx.conf.example`
  - 宿主机 `nginx` 示例，把正式域名代理到新容器端口

## 默认并行端口

为了不直接碰当前旧版 AI Mandala 的 `80 -> 8000` 现场，当前默认端口是：

- 前端容器：宿主机 `8101`
- 后端容器：宿主机 `8100`

这样可以先在正式机上并行验证：

- `http://127.0.0.1:8101`
- `http://127.0.0.1:8100/health`

确认新版本没问题后，再把宿主机 `nginx` 从旧站切到：

- `web.jingshu.cc -> 127.0.0.1:8101`
- `web-api.jingshu.cc -> 127.0.0.1:8100`

当前正式机已经切流完成，并已启用 HTTPS：

- `https://web.jingshu.cc`
- `https://web-api.jingshu.cc/health`

## 最小使用方式

在正式机的新版代码目录中：

```bash
cd /opt/aimandala-release/app/mindsync/projects/aimandala/deploy/docker
cp .env.release.example .env.release
docker compose -f docker-compose.release.yml --env-file .env.release build
docker compose -f docker-compose.release.yml --env-file .env.release up -d
```

说明：

- `.env.release` 中的 `VITE_AIMANDALA_API_BASE_URL` 应保持为 `https://web-api.jingshu.cc`
- 否则正式前端在 HTTPS 页面下会请求 HTTP API，浏览器会触发 mixed content 拦截

## 当前约束

1. 这套骨架默认以 `mindsync/projects/aimandala` 为构建上下文，不复用旧版 `ai-mandala` 根目录
2. 当前 release Docker 仍假设后端使用本地上传或显式传入 COS/LLM 环境变量
3. 当前宿主机 TLS、证书和最终域名切流仍由宿主机 `nginx` 负责，不在容器里终结证书
4. 证书当前由宿主机 `certbot + nginx` 管理，自动续期依赖系统内置 `certbot.timer`
