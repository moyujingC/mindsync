# RelayHub Console release 静态试用入口

## 1. 目标

为 `RelayHub console` 提供 release 宿主机上的最小静态试用入口：

- 推荐入口：`https://relayhub.jingshu.cc/`
- 兼容入口：`https://web.jingshu.cc/relayhub/`
- 默认入口仍为 mock
- 显式 trial 构建用于 Providers readonly real-fetch 试用

## 2. 目录约定

- 代码目录：`/opt/aimandala-release/app/mindsync`
- console 目录：`/opt/aimandala-release/app/mindsync/projects/relayhub/console`
- 构建目录：`/opt/aimandala-release/app/mindsync/projects/relayhub/console/dist`
- 子域静态发布目录：`/var/www/relayhub.jingshu.cc`
- 兼容子路径静态发布目录：`/var/www/web.jingshu.cc/relayhub`
- nginx 站点样例：`/etc/nginx/sites-available/web.jingshu.cc`

## 3. 构建方式

默认 mock 构建：

```bash
cd /opt/aimandala-release/app/mindsync/projects/relayhub/console
npm ci
npm run build
```

release trial 构建：

```bash
cd /opt/aimandala-release/app/mindsync/projects/relayhub/console
npm ci
RELAYHUB_CONSOLE_BASE_PATH=/ \
RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch \
RELAYHUB_PROVIDERS_READONLY_BASE_URL=/relayhub-api \
npm run build:trial
```

如需静态默认 headers：

```bash
RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON='{"x-relayhub-scope":"providers-readonly"}'
```

## 4. 同步方式

推荐子域发布：

```bash
sudo mkdir -p /var/www/relayhub.jingshu.cc
sudo PUBLISH_DIR=/var/www/relayhub.jingshu.cc \
  BACKUP_DIR=/var/www/relayhub.jingshu.cc.previous \
  bash deploy-relayhub-console-trial.sh
```

兼容子路径发布仍可使用默认 `PUBLISH_DIR=/var/www/web.jingshu.cc/relayhub`。

## 5. nginx 要求

独立子域：

- `server_name relayhub.jingshu.cc`
- `location /` 使用 `root /var/www/relayhub.jingshu.cc`
- 子路由刷新时 fallback 到 `/index.html`
- `location = /relayhub-api` 与 `location /relayhub-api/` 保留 disabled guard，直到真实 upstream 提供

兼容子路径：

- `location = /relayhub` 重定向到 `/relayhub/`
- `location /relayhub/` 使用 alias 指向静态目录
- 子路由刷新时 fallback 到 `/relayhub/index.html`
- `location = /relayhub-api` 重定向到 `/relayhub-api/`
- `location /relayhub-api/` 反代到真实 Providers readonly upstream

参考：`relayhub-console.nginx.conf.example`

## 5.1 Providers readonly upstream

`/relayhub-api` 必须等真实 upstream URL 明确后再安装，不能把占位符写入正在生效的 nginx 配置。

约定：

- `UPSTREAM_BASE_URL` 不包含最终 `/providers` path
- upstream collection contract：`GET <UPSTREAM_BASE_URL>/providers -> { items: [...] }`
- upstream detail contract：`GET <UPSTREAM_BASE_URL>/providers/:id -> { item: {...} }`
- upstream missing detail：返回 `404` 或 `{ item: null }`

安装方式：

```bash
sudo UPSTREAM_BASE_URL=https://<readonly-upstream> \
  bash install-relayhub-api-nginx-location.sh
```

安装后验证：

```bash
curl -k -I https://web.jingshu.cc/relayhub-api/providers
```

## 6. 当前 release 实装记录

截至 `2026-04-18`，release 节点已经安装：

- 子域服务器侧配置：`relayhub.jingshu.cc` nginx server block 已安装
- 子域公网 DNS：待生效；Let’s Encrypt 当前仍看到 `NXDOMAIN`
- 静态目录：`/var/www/web.jingshu.cc/relayhub`
- 子域静态目录：`/var/www/relayhub.jingshu.cc`
- nginx 配置：`/etc/nginx/sites-available/ai-mandala`
- nginx 配置备份：`/etc/nginx/sites-available/ai-mandala.relayhub-backup-20260418-044113`

已验证：

- `https://web.jingshu.cc/relayhub/`
- `https://web.jingshu.cc/relayhub/providers`
- `https://web.jingshu.cc/relayhub/providers/deepseek-direct`

尚未安装：

- `/relayhub-api` 真实 readonly upstream 反代
- 原因：`UPSTREAM_BASE_URL` 尚未提供
- release 当前已安装 disabled guard，`/relayhub-api/*` 在 upstream 未配置前返回 `503`，避免误落到主站 HTML

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
