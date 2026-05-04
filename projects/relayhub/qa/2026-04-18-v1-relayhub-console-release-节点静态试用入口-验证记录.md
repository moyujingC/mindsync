# RelayHub Console：release 节点静态试用入口验证记录

> 状态：current
> owner：Engineer
> last_updated：2026-04-18

## 1. 计划内验证项

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run build:trial`
- [x] `/relayhub` 子路径路由验证
- [x] release 节点静态目录同步
- [x] nginx 配置校验与 reload
- [x] 误导表达全文搜索

## 2. 本地验证结果

- `npm test` 通过：`325 passed`
- `npm run build` 通过：默认 mock 构建成功
- `npm run build:trial` 通过：trial 构建成功，部署入口收口为 `dist/index.html`
- 新增 basename 测试，确认 `/relayhub/providers` 与 `/relayhub/providers/:id` 在子路径路由下可匹配

## 3. release 节点验证结果

- release 主机：`42.192.65.145`
- 推荐子域静态目录：`/var/www/relayhub.jingshu.cc`
- 兼容子路径静态目录：`/var/www/web.jingshu.cc/relayhub`
- nginx 配置：`/etc/nginx/sites-available/ai-mandala`
- nginx 备份：`/etc/nginx/sites-available/ai-mandala.relayhub-backup-20260418-044113`
- `nginx -t` 通过
- `systemctl reload nginx` 已执行

HTTP 验证：

- `relayhub.jingshu.cc` nginx HTTP server block 已安装
- `/var/www/relayhub.jingshu.cc` 静态目录已同步 trial 根路径构建产物
- `curl --resolve relayhub.jingshu.cc:80:42.192.65.145 http://relayhub.jingshu.cc/` 返回 `200`
- `curl --resolve relayhub.jingshu.cc:80:42.192.65.145 http://relayhub.jingshu.cc/providers` 返回 `200`
- `curl --resolve relayhub.jingshu.cc:80:42.192.65.145 http://relayhub.jingshu.cc/api/models` 返回 `200`
- `relayhub.jingshu.cc -> 42.192.65.145` 公网 DNS 已生效
- `certbot --nginx -d relayhub.jingshu.cc` 已成功
- 证书路径：`/etc/letsencrypt/live/relayhub.jingshu.cc/fullchain.pem`
- `https://relayhub.jingshu.cc/` 返回 `200`
- `https://relayhub.jingshu.cc/providers` 返回 `200`
- `https://relayhub.jingshu.cc/api/models` 返回 `200`
- `http://relayhub.jingshu.cc/` 返回 `301` 重定向到 HTTPS
- `https://web.jingshu.cc/relayhub/` 返回 `200`
- `https://web.jingshu.cc/relayhub/providers` 返回 `200`
- `https://web.jingshu.cc/relayhub/providers/deepseek-direct` 返回 `200`
- `https://web.jingshu.cc/relayhub/assets/index-xhnVBqSO.js` 返回 `200`

浏览器验证：

- Playwright 打开 `https://relayhub.jingshu.cc/providers`
- 页面标题为 `RelayHub Console Trial`
- Providers 页面已显示真实 model-derived 列表：
  - `gpt-5`
  - `gpt-5.3-codex`
  - `gpt-5.4-mini`
- `https://relayhub.jingshu.cc/providers/gpt-5` 已显示真实 model-derived detail
- 兼容入口 `https://web.jingshu.cc/relayhub/providers` 仍可访问

## 4. 误导表达搜索

执行命令：

```bash
rg -n "保存策略|立即切流|发布到生产|启用自动路由|编辑生产白名单|立即应用配置" projects/relayhub --glob '!projects/relayhub/console/dist/**' --glob '!**/dist/**'
```

结果：

- 命中均位于“不提供 / 禁止 / QA检查项 / 验证记录”语境
- 未发现新增可执行控制动作文案

## 5. `/api` 接入结果

- Git 推送已完成：既有 release trial 分支已推送
- 已补充 `/api` nginx 反代样例与参数化安装脚本
- release 线上 nginx 已切换为同源反代：
  - upstream：`https://code.ppchat.vip/v1/`
  - 固定认证头：`Authorization: Bearer <release-only token>`
- 当前 trial 构建已收敛为：
  - `RELAYHUB_PROVIDERS_READONLY_BASE_URL=/api`
  - `RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT=openai-models`
- 当前主验证路径为：
  - `https://relayhub.jingshu.cc/api/models`
  - `https://relayhub.jingshu.cc/providers`
  - `https://relayhub.jingshu.cc/providers/gpt-5`

本轮接入准备验证：

- `npm test` 通过：`325 passed`
- `npm run build` 通过
- `RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch RELAYHUB_PROVIDERS_READONLY_BASE_URL=/api RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT=openai-models npm run build:trial` 通过
- 误导表达全文搜索完成，命中仍位于“不提供 / 禁止 / QA检查项 / 验证记录”语境
