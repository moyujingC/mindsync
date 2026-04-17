# RelayHub Console release 静态试用入口

## 1. 目标

为 `RelayHub console` 提供 release 宿主机上的最小静态试用入口：

- 域名子路径：`/relayhub`
- 默认入口仍为 mock
- 显式 trial 构建用于 Providers readonly real-fetch 试用

## 2. 目录约定

- 代码目录：`/opt/aimandala-release/app/mindsync`
- console 目录：`/opt/aimandala-release/app/mindsync/projects/relayhub/console`
- 构建目录：`/opt/aimandala-release/app/mindsync/projects/relayhub/console/dist`
- 静态发布目录：`/var/www/web.jingshu.cc/relayhub`
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
RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch \
RELAYHUB_PROVIDERS_READONLY_BASE_URL=https://<readonly-target> \
npm run build:trial
```

如需静态默认 headers：

```bash
RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON='{"x-relayhub-scope":"providers-readonly"}'
```

## 4. 同步方式

使用 `deploy-relayhub-console-trial.sh`：

```bash
sudo mkdir -p /var/www/web.jingshu.cc/relayhub
sudo bash deploy-relayhub-console-trial.sh
```

## 5. nginx 子路径要求

- `location = /relayhub` 重定向到 `/relayhub/`
- `location /relayhub/` 使用 alias 指向静态目录
- 子路由刷新时 fallback 到 `/relayhub/index.html`

参考：`relayhub-console.nginx.conf.example`

## 6. 当前 release 实装记录

截至 `2026-04-18`，release 节点已经安装：

- 静态目录：`/var/www/web.jingshu.cc/relayhub`
- nginx 配置：`/etc/nginx/sites-available/ai-mandala`
- nginx 配置备份：`/etc/nginx/sites-available/ai-mandala.relayhub-backup-20260418-044113`

已验证：

- `https://web.jingshu.cc/relayhub/`
- `https://web.jingshu.cc/relayhub/providers`
- `https://web.jingshu.cc/relayhub/providers/deepseek-direct`

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
