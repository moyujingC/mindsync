# AIMandala Release Docker 骨架

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/deploy/docker/README.md

> 适用范围：`aimandala` 新版 `release` 并行部署

本目录用于为正式机上的新版 `aimandala` 提供 Docker 发布入口。

截至 `2026-04-12`，这里不再只是“并行验证骨架”，而是 `release -> prod` 的正式交付入口；旧容器只作为当日回退目标保留。

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

- `.env.release` 中的 `VITE_AIMANDALA_API_BASE_URL` 必须保持为 `https://web-api.jingshu.cc`
- `.env.release` 中的 `AIMANDALA_LLM_BACKEND` 应保持为 `openai_compatible`
- `.env.release` 中的 `AIMANDALA_LLM_MODEL` / `AIMANDALA_LLM_CHAT_MODEL` / `AIMANDALA_LLM_VISION_MODEL` 当前统一使用 `deepseek-v4-pro`
- 若正式接入 RelayHub，`.env.release` 中的 `AIMANDALA_LLM_BASE_URL` 应改为 `https://relayhub.jingshu.cc/aimandala/v1`，但模型入口仍应解析到 DeepSeek V4 Pro
- `.env.release` 中的 `AIMANDALA_UPLOAD_BACKEND` 应保持为 `cos`
- `.env.release` 中的 `AIMANDALA_ENABLE_DEBUG_WORKBENCH` 应保持为 `0`
- 否则正式前端会产生 mixed content 或把调试能力暴露到生产环境

## 当前约束

1. 这套发布入口默认以 `mindsync/projects/aimandala` 为构建上下文，不复用旧版 `ai-mandala` 根目录
2. `release` 的正式默认口径是 `openai_compatible + cos + RelayHub prod-relay 或正式 OpenAI-compatible 网关 + debug workbench off`
3. 当前宿主机 TLS、证书和最终域名切流仍由宿主机 `nginx` 负责，不在容器里终结证书
4. 旧版 AI Mandala 容器仅作为回退目标保留，不再作为新功能开发或正式发布入口
5. 证书当前由宿主机 `certbot + nginx` 管理，自动续期依赖系统内置 `certbot.timer`
