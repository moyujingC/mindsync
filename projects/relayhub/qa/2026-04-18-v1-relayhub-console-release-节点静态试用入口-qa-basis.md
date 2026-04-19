# RelayHub Console：release 节点静态试用入口 QA Basis

> 状态：current
> owner：QA / Engineer
> last_updated：2026-04-18

## 1. 代码验证

- `npm test`
- `npm run build`
- `npm run build:trial`

## 2. 路由验证

- `/relayhub` 可打开
- `/relayhub/providers` 可刷新
- `/relayhub/providers/:id` 可刷新
- 页面静态资源走 `/relayhub/assets/*`

## 3. 运行时验证

- 默认入口保持 mock
- trial 入口可显式使用 browser-fetch readonly real-fetch
- `RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON` 可进入请求
- detail `404` 映射为 `not-found`
- 非 `404` 非 `2xx` 继续向上抛

## 4. 运维验证

- 静态目录同步成功
- `nginx -t` 成功
- `systemctl reload nginx` 成功
- 回滚目录与回滚命令清晰

## 5. 文案审查

全文搜索以下误导表达，命中只能出现在“不提供 / 禁止 / QA检查项”语境：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`
