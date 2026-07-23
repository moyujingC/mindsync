# 链接收件箱部署说明

> 状态：working
> 版本：0.1.0
> owner：Engineering
> last_updated：2026-07-23
> source_of_truth：projects/content-matrix/tools/influencer-tracker/docs/link-inbox-deployment.md

## 1. 运行形态

```text
iPhone 快捷指令
-> https://<你的域名>/v1/inbox/links
-> Nginx（反向代理）
-> link-inbox.service（常驻 HTTP 收件）
-> logs/link-inbox.json + 飞书“链接收件箱”
-> link-inbox-worker.timer（每分钟消费一条）
-> TikHub / 飞书内容、评论、研究请求 / 本地简报
```

服务只绑定服务器本机 `127.0.0.1:8787`，公网 HTTPS 由 Nginx 提供。手机不得调用 HTTP 地址。先确认目标域名的 Nginx 虚拟主机和 TLS 证书有效，例如：

```bash
curl -I https://<你的域名>/health
```

应返回 `200` 且证书名称匹配域名。当前 `hermes.jingshu.cc` 的旧 404 或证书不匹配状态必须先修复，再部署收件服务。

## 2. 服务器环境变量

在服务器创建仅 root 可读的文件 `/etc/content-matrix-inbox.env`：

```bash
INBOX_RECEIVER_TOKEN='用 openssl rand -hex 32 生成的随机值'
TIKHUB_API_KEY='服务器专用 TikHub Key'
# 可选。未设置时不发飞书群通知。
FEISHU_GROUP_WEBHOOK_URL='https://open.feishu.cn/open-apis/bot/v2/hook/...'
```

权限：

```bash
sudo chown root:root /etc/content-matrix-inbox.env
sudo chmod 600 /etc/content-matrix-inbox.env
```

飞书多维表格配置仍使用部署目录下未提交的 `config/feishu.local.json`。不要把上述 Token、Webhook 或 TikHub Key 写入 Git、飞书字段、日志或 iPhone 快捷指令以外的位置。

## 3. systemd

把 `deploy/link-inbox.service`、`deploy/link-inbox-worker.service`、`deploy/link-inbox-worker.timer` 复制到 `/etc/systemd/system/`，并把其中的 `WorkingDirectory` 改成服务器实际 checkout（检出目录）。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now link-inbox.service
sudo systemctl enable --now link-inbox-worker.timer
sudo systemctl status link-inbox.service link-inbox-worker.timer
curl http://127.0.0.1:8787/health
```

Worker 每次最多领取一条队列记录。失败记录会停在“失败”，由人工通过 `npm run inbox:worker -- --retry <收件ID>` 重试，避免无界重复消耗 TikHub 调用。

## 4. Nginx 和 TLS

将 `deploy/nginx-link-inbox.conf.example` 的 `server_name` 改成实际域名，并纳入已有 HTTPS server block。不要另起一个与 Hermes 冲突的 `server` 块；如果同域名已有 Hermes，新增 location 即可。

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -i https://<你的域名>/health
```

`/v1/inbox/links` 仅允许 `POST`。Nginx 仍需要在证书到期前按现有 Certbot（证书工具）策略续期。

## 5. iPhone 快捷指令

背板双击无法读取其他 App 当前页面 URL，因此流程是“在内容 App 复制链接”后再双击。

在“快捷指令”新建 `内容收件箱`：

1. 添加“获取剪贴板”。
2. 添加“获取 URL 内容”，URL 填 `https://<你的域名>/v1/inbox/links`，方法选 `POST`。
3. 请求正文选 `JSON`，添加 `url` = 剪贴板、`source` = `iphone-back-tap`、`mode` = `collect`。
4. 请求头添加 `Authorization: Bearer <INBOX_RECEIVER_TOKEN>` 和 `Content-Type: application/json`。
5. 添加“显示结果”，显示接口返回的 `message` 和 `inboxId`。
6. 在 iPhone“设置 -> 辅助功能 -> 触控 -> 轻点背面 -> 轻点两下”选择 `内容收件箱`。

第一次先手动运行快捷指令，用一条公开链接确认返回“链接已进入收件箱”，再绑定背板双击。

## 6. 验收与排障

```bash
# 代码与飞书 schema
npm test
npm run validate:feishu -- --feishu config/feishu.local.json
npm run inspect:feishu -- --feishu config/feishu.local.json

# 服务日志
sudo journalctl -u link-inbox.service -f
sudo journalctl -u link-inbox-worker.service -n 100 --no-pager
```

- 收件箱为“待处理”：确认 timer 是否触发、`TIKHUB_API_KEY` 是否在环境文件中。
- 收件箱为“失败”：查看错误摘要；确认 TikHub 额度、端点权限和网络，再显式重试。
- 收件箱为“需人工处理”：链接是博主主页或无法识别的 URL；人工判断是否建立账号追踪。
- 飞书群无通知：检查 `FEISHU_GROUP_WEBHOOK_URL`，但不要因为通知失败重新提交链接。
- 需要转录：先合法取得媒体文件，再使用 `npm run media:process`；平台收件不会自动下载视频。
