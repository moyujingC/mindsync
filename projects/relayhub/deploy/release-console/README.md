# RelayHub Console release 静态试用入口

## 1. 目标

为 `RelayHub frontend` 提供 release 宿主机上的最小试用入口。

当前 release 现实约束：

- `/opt/aimandala-release/app/mindsync` 现有 checkout 仍服务主业务 release，且可能带有脏工作区
- RelayHub 当前应在 release 机上使用独立 `git worktree` 部署
- 正式发布默认使用更安全的 deploy worktree：`/opt/aimandala-release/worktrees/relayhub-dev-deploy`
- 旧目录 `/opt/aimandala-release/worktrees/relayhub` 可能已经带脏改，不再作为默认发布工作树

因此本 runbook 的默认口径改为：

- 主仓库只负责提供 git 元数据
- RelayHub 的构建、service 与静态发布，都从独立 worktree 路径执行

最小试用入口：

- 推荐入口：`https://relayhub.jingshu.cc/`
- 兼容入口：`https://web.jingshu.cc/relayhub/`
- 默认入口仍为 mock
- 显式 trial 构建用于：
  - Providers readonly real-fetch 试用
  - control-plane 可写试用

## 2. 目录约定

- 主仓库目录：`/opt/aimandala-release/app/mindsync`
- RelayHub worktree：`/opt/aimandala-release/worktrees/relayhub-dev-deploy`
- frontend 目录：`/opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/frontend`
- 构建目录：`/opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/frontend/out`
- control-plane 目录：`/opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/control-plane`
- 子域静态发布目录：`/var/www/relayhub.jingshu.cc`
- 兼容子路径静态发布目录：`/var/www/web.jingshu.cc/relayhub`
- nginx 站点样例：`/etc/nginx/sites-available/web.jingshu.cc`
- control-plane 数据目录：`/var/lib/relayhub/control-plane`
- control-plane 环境文件：`/etc/default/relayhub-control-plane`
- control-plane systemd：`/etc/systemd/system/relayhub-control-plane.service`
- dev-relay 环境文件：`/etc/default/relayhub-dev-relay`
- dev-relay systemd：`/etc/systemd/system/relayhub-dev-relay.service`
- aimandala prod-relay 环境文件：`/etc/default/relayhub-prod-relay-aimandala`
- aimandala prod-relay systemd：`/etc/systemd/system/relayhub-prod-relay-aimandala.service`

## 3. 构建方式

默认 mock 构建：

```bash
cd /opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/frontend
npm ci
npm run build
```

release trial 构建：

```bash
cd /opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/frontend
npm ci
RELAYHUB_CONSOLE_BASE_PATH=/ \
RELAYHUB_CONTROL_PLANE_BASE_URL=/api/control-plane \
RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch \
RELAYHUB_PROVIDERS_READONLY_BASE_URL=/api \
RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT=openai-models \
npm run build
```

如需静态默认 headers：

```bash
RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON='{"x-relayhub-scope":"providers-readonly"}'
```

## 4. 同步方式

推荐子域发布：

```bash
cd /opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/deploy/release-console
sudo mkdir -p /var/www/relayhub.jingshu.cc
sudo REPO_ROOT=/opt/aimandala-release/worktrees/relayhub-dev-deploy \
  FRONTEND_DIR=/opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/frontend \
  DIST_DIR=/opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/frontend/out \
  PUBLISH_DIR=/var/www/relayhub.jingshu.cc \
  BACKUP_DIR=/var/www/relayhub.jingshu.cc.previous \
  bash deploy-relayhub-console-trial.sh
```

兼容子路径发布仍可使用默认 `PUBLISH_DIR=/var/www/web.jingshu.cc/relayhub`。

## 4.0 release worktree 准备

先在 release 机准备独立 worktree：

```bash
cd /opt/aimandala-release/app/mindsync
git config --add remote.origin.fetch +refs/heads/relayhub/dev:refs/remotes/origin/relayhub/dev
git fetch origin refs/heads/relayhub/dev:refs/remotes/origin/relayhub/dev
mkdir -p /opt/aimandala-release/worktrees
git worktree add /opt/aimandala-release/worktrees/relayhub-dev-deploy origin/relayhub/dev
```

说明：

- 如果主 checkout 存在未提交改动，不要直接在主 checkout 切 `relayhub/dev`
- 一律通过 `git worktree add` 新开 RelayHub 隔离工作树
- 发布脚本会再次确保 `remote.origin.fetch` 包含 `relayhub/dev`，避免服务器只抓 `release` 导致发布旧代码

### 4.0.1 一键部署主路径

如果目标是把 `RelayHub Console + control-plane + dev-relay + /claude + /api/control-plane` 一次性收口到 release，当前推荐直接执行：

```bash
cd /opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/deploy/release-console
bash deploy-relayhub-release-stack.sh
```

这条脚本会顺序完成：

- 准备或更新 RelayHub worktree
- 构建并发布 frontend trial
- 安装 `relayhub-control-plane`
- 安装 `relayhub-dev-relay`
- 安装 nginx 的 `/api/control-plane/` 与 `/claude/`
- 做本机与公网健康检查

## 4.1 control-plane 安装

安装 systemd 服务：

```bash
cd /opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/deploy/release-console
sudo REPO_ROOT=/opt/aimandala-release/worktrees/relayhub-dev-deploy \
  WORKING_DIRECTORY=/opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/control-plane \
  PORT=4318 \
  DATA_DIR=/var/lib/relayhub/control-plane \
  bash install-relayhub-control-plane-service.sh
```

安装 nginx 同源反代：

```bash
cd /opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/deploy/release-console
sudo CONTROL_PLANE_PORT=4318 \
  bash install-relayhub-control-plane-nginx-location.sh
```

## 4.2 dev-relay 安装

安装 Codex 专用 relay service：

```bash
cd /opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/deploy/release-console
sudo REPO_ROOT=/opt/aimandala-release/worktrees/relayhub-dev-deploy \
  WORKING_DIRECTORY=/opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/dev-relay \
  PORT=4319 \
  DATA_DIR=/var/lib/relayhub/control-plane \
  bash install-relayhub-dev-relay-service.sh
```

安装 nginx 上的 Claude / Codex 开发工作流入口：

```bash
cd /opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/deploy/release-console
sudo CLAUDE_RELAY_PORT=4319 \
  bash install-relayhub-claude-nginx-location.sh
sudo CODEX_RELAY_PORT=4319 \
  bash install-relayhub-codex-nginx-location.sh
```

## 4.3 AI曼陀罗 prod-relay 安装

安装 AI曼陀罗 生产 relay service：

```bash
cd /opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/deploy/release-console
sudo REPO_ROOT=/opt/aimandala-release/worktrees/relayhub-dev-deploy \
  WORKING_DIRECTORY=/opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/prod-relay/aimandala \
  PORT=4320 \
  DATA_DIR=/var/lib/relayhub/control-plane \
  bash install-relayhub-prod-relay-aimandala-service.sh
```

安装 nginx 上的 AI曼陀罗 生产入口：

```bash
cd /opt/aimandala-release/worktrees/relayhub-dev-deploy/projects/relayhub/deploy/release-console
sudo AIMANDALA_RELAY_PORT=4320 \
  bash install-relayhub-prod-relay-aimandala-nginx-location.sh
```

## 5. nginx 要求

独立子域：

- `server_name relayhub.jingshu.cc`
- `location /` 使用 `root /var/www/relayhub.jingshu.cc`
- 子路由刷新时 fallback 到 `/index.html`
- `location /api/control-plane/` 反代到本机 `relayhub-control-plane`
- `location /claude/` 反代到本机 `relayhub-dev-relay`
- `location /codex/v1/` 反代到本机 `relayhub-dev-relay`
- `location /aimandala/v1/` 反代到本机 `relayhub-prod-relay-aimandala`
- `location = /api` 与 `location /api/` 保留 disabled guard，直到真实 upstream 提供
- `/api/control-plane/*`、`/api/* readonly`、`/claude/*`、`/codex/v1/*`、`/aimandala/v1/*` 五类位置必须完全分开

兼容子路径：

- `location = /relayhub` 重定向到 `/relayhub/`
- `location /relayhub/` 使用 alias 指向静态目录
- 子路由刷新时 fallback 到 `/relayhub/index.html`
- `location = /api` 重定向到 `/api/`
- `location /api/` 反代到真实 Providers readonly upstream

参考：`relayhub-console.nginx.conf.example`

## 5.1 control-plane 同源 API

`/api/control-plane/*` 固定承接 RelayHub 自己的可写 API：

- `GET /api/control-plane/health`
- `GET /api/control-plane/overview`
- `GET/POST/PATCH/DELETE /api/control-plane/models`
- `POST /api/control-plane/models/:id/test`
- `GET/POST/PATCH/DELETE /api/control-plane/tasks`
- `GET/POST /api/control-plane/runs`
- `GET /api/control-plane/tasks/:id/stats`

当前口径：

- nginx 去掉 `/api/control-plane` 前缀后，再转给本机 `127.0.0.1:<PORT>`
- `control-plane` 继续消费自身已有 `/models`、`/tasks`、`/runs`、`/overview` 路径
- `/api/control-plane/*` 与 `/api/models` 等 readonly 代理不混用

## 5.2 Codex 原生入口

`/codex/v1/*` 固定承接 Codex-first 的原生 `Responses API` 路径：

- `GET /codex/v1/models`
- `POST /codex/v1/responses`

当前口径：

- nginx 去掉 `/codex/v1` 前缀后，再转给本机 `127.0.0.1:4319`
- `dev-relay` 继续暴露 `/v1/models`、`/v1/responses`
- 不做 `responses -> chat/completions` 协议转译
- 该 location 必须显式开启 SSE（Server-Sent Events，服务端事件流）友好配置：
  - `proxy_http_version 1.1`
  - `proxy_buffering off`
  - `proxy_request_buffering off`
  - `proxy_read_timeout 600s`
  - `gzip off`

## 5.3 Claude release 入口

`/claude/*` 固定承接 Claude Code 走 Anthropic 兼容的入口：

- `POST /claude/v1/messages`
- `POST /claude/v1/messages/count_tokens`
- `POST /claude/chat/completions`
- `POST /claude/v1/chat/completions`

当前口径：

- nginx 去掉 `/claude` 前缀后，再转给本机 `127.0.0.1:4319`
- `dev-relay` 继续固定读取 `task-claude-code`
- 不新增第二套 Claude 专用 service
- 当 `task-claude-code` 绑定到 `AITechFlux` 时：
  - `POST /v1/messages` 原生透传到上游 `/messages`
  - 不再做 `Anthropic -> OpenAI -> Anthropic` 协议转译
  - `POST /v1/messages/count_tokens` 继续由本机 `dev-relay` 本地估算兜底
- `PPChat` 不再作为 Claude 默认主链路，只保留给 OpenAI / Codex 类入口

## 5.4 AI曼陀罗 生产入口

`/aimandala/v1/*` 固定承接 AI曼陀罗 的 OpenAI-compatible 生产请求：

- `POST /aimandala/v1/chat/completions`

当前口径：

- nginx 去掉 `/aimandala/v1` 前缀后，再转给本机 `127.0.0.1:4320`
- `prod-relay/aimandala` 只接受任务模型别名，不接受直接把真实上游模型名写进产品配置
- 生产任务只允许绑定 `domestic-model`

## 5.5 Providers readonly upstream

`/api` 必须等真实 upstream URL 与认证方式明确后再安装，不能把占位符写入正在生效的 nginx 配置。

约定：

- `UPSTREAM_BASE_URL` 不包含最终 `/providers` path
- `UPSTREAM_AUTHORIZATION_BEARER` 由 release 侧显式注入
- 若走默认 Providers contract：
  - upstream collection contract：`GET <UPSTREAM_BASE_URL>/providers -> { items: [...] }`
  - upstream detail contract：`GET <UPSTREAM_BASE_URL>/providers/:id -> { item: {...} }`
- 若走 OpenAI-compatible models trial：
  - upstream collection contract：`GET <UPSTREAM_BASE_URL>/models -> { data: [...] }`
  - detail 由前端 collection 结果按 `id` 派生，不依赖 `/models/:id`

安装方式：

```bash
sudo UPSTREAM_BASE_URL=https://<readonly-upstream> \
  UPSTREAM_AUTHORIZATION_BEARER=<token> \
  bash install-relayhub-api-nginx-location.sh
```

安装后验证：

```bash
curl -k -I https://relayhub.jingshu.cc/api/models
```

control-plane 安装后验证：

```bash
curl http://127.0.0.1:4318/health
curl -k https://relayhub.jingshu.cc/api/control-plane/health
curl -k https://relayhub.jingshu.cc/api/control-plane/models
```

dev-relay 安装后验证：

```bash
curl http://127.0.0.1:4319/health
curl -k https://relayhub.jingshu.cc/claude/health
curl -k https://relayhub.jingshu.cc/claude/v1/messages/count_tokens \
  -H 'content-type: application/json' \
  --data '{"model":"relayhub-task-claude-code","messages":[{"role":"user","content":"hello"}]}'
curl -k https://relayhub.jingshu.cc/claude/v1/messages \
  -H 'content-type: application/json' \
  -H 'anthropic-version: 2023-06-01' \
  --data '{"model":"relayhub-task-claude-code","max_tokens":24,"messages":[{"role":"user","content":[{"type":"text","text":"Reply with exactly ok"}]}]}'
curl -k https://relayhub.jingshu.cc/codex/v1/models
curl -k https://relayhub.jingshu.cc/codex/v1/responses \
  -H 'content-type: application/json' \
  --data '{"input":"Reply with exactly ok","stream":false}'
curl -k -N https://relayhub.jingshu.cc/codex/v1/responses \
  -H 'content-type: application/json' \
  --data '{"input":"Reply with exactly ok","stream":true}'
```

AI曼陀罗 prod-relay 安装后验证：

```bash
curl http://127.0.0.1:4320/health
curl -k https://relayhub.jingshu.cc/aimandala/v1/chat/completions \
  -H 'content-type: application/json' \
  --data '{"model":"relayhub-task-aimandala-lite-report","messages":[{"role":"user","content":"hello"}]}'
```

## 6. 当前 release 实装记录

截至 `2026-04-19`，release 节点已确认：

- 子域服务器侧配置：`relayhub.jingshu.cc` nginx server block 已安装
- 子域公网 DNS 已生效
- 静态目录：`/var/www/web.jingshu.cc/relayhub`
- 子域静态目录：`/var/www/relayhub.jingshu.cc`
- nginx 配置：`/etc/nginx/sites-available/ai-mandala`
- RelayHub 独立 worktree：`/opt/aimandala-release/worktrees/relayhub`

已验证：

- `https://web.jingshu.cc/relayhub/`
- `https://web.jingshu.cc/relayhub/providers`
- `https://web.jingshu.cc/relayhub/providers/deepseek-direct`
- `relayhub-control-plane` service 可从独立 worktree 拉起
- `https://relayhub.jingshu.cc/api/control-plane/health` 返回 `{"ok": true}`
- `https://relayhub.jingshu.cc/api/control-plane/models` 返回模型条目 JSON
- `https://relayhub.jingshu.cc/claude/*` 作为 Claude Code 默认主入口，需随本轮一并安装
- `https://relayhub.jingshu.cc/codex/v1/*` 作为 Codex 原生入口，需随本轮一并安装
- `https://relayhub.jingshu.cc/aimandala/v1/*` 作为 AI曼陀罗 生产入口，需随本轮一并安装

尚未安装：

- `/api` 真实 readonly upstream 反代认证
- 原因：真实 upstream 与 token 注入策略在上一阶段尚未收口
- release 当前已安装 disabled guard，`/api/*` 在 upstream 未配置前返回 `503`，避免误落到主站 HTML

## 7. reload 与回滚

校验：

```bash
sudo nginx -t
```

重载：

```bash
sudo systemctl reload nginx
```

回滚：

```bash
sudo rm -rf /var/www/web.jingshu.cc/relayhub
sudo mv /var/www/web.jingshu.cc/relayhub.previous /var/www/web.jingshu.cc/relayhub
sudo cp /etc/nginx/sites-available/ai-mandala.relayhub-backup-20260418-044113 /etc/nginx/sites-available/ai-mandala
sudo nginx -t
sudo systemctl reload nginx
```

control-plane 服务：

```bash
sudo systemctl restart relayhub-control-plane
sudo systemctl status relayhub-control-plane --no-pager
```

dev-relay 服务：

```bash
sudo systemctl restart relayhub-dev-relay
sudo systemctl status relayhub-dev-relay --no-pager
```

AI曼陀罗 prod-relay 服务：

```bash
sudo systemctl restart relayhub-prod-relay-aimandala
sudo systemctl status relayhub-prod-relay-aimandala --no-pager
```
