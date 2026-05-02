# RelayHub v1：中转入口可用模型列表拉取与 `modelId` 切换 QA Basis

## Summary

本轮 QA 只验证一条主路径：

- 预置中转入口可以主动拉上游可用模型列表
- 用户可以从列表中切当前 `modelId`
- 保存后仍需显式测试连接

## Checks

### control-plane

- `GET /models/:id/catalog` 在有 `API Key` 的预置中转入口上能返回模型列表
- 缺少 `API Key` 时返回明确错误
- 非中转预置入口返回明确错误
- 上游非 `2xx` 时返回清楚错误摘要
- 上游返回结构不合法时返回清楚错误

### console service

- `getModelCatalog(id)` 在 server 模式下请求：
  - `/api/control-plane/models/:id/catalog`
- mock 模式下返回固定样本列表

### 路由 / UI

- 预置中转入口编辑时显示“获取可用模型”
- 拉取成功后展示“可用模型列表”
- 预置中转入口不再允许自由手填 `modelId`
- 预置入口继续锁定 `baseUrl`
- 自定义入口仍可自由编辑 `modelId`
- 选择并保存后，提示“下一步请测试连接”

### 手工 smoke

1. `AITechFlux`
   - 打开 `/models`
   - 编辑 `AITechFlux 中转`
   - 点击“获取可用模型”
   - 看到 `高性能极速模型 / 高性能低价模型 / Claude混合版`
   - 选择一个模型并保存
   - 再显式测试连接

2. 错误路径
   - 未保存 `API Key` 时点击“获取可用模型”
   - 页面明确提示先补 `API Key`

## Verification

- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`
- `cd projects/relayhub/dev-relay && npm test`
