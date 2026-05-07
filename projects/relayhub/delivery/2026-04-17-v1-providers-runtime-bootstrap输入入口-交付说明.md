# 2026-04-17 v1 Providers Runtime Bootstrap 输入入口 交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-runtime-bootstrap输入入口-交付说明.md


## 交付内容

- 新增 providers runtime bootstrap input 入口
- 保持现有 `ProvidersRuntimeBootstrapOptions` 兼容
- `ConsoleAppRuntimeOptions` 新增可选 `providersBootstrapInput?`
- 默认 providers 行为继续保持 mock

## 交付边界

- 本轮只收束 bootstrap 输入层
- 不新增 deployment/browser app 级 bootstrap 输入
- 不扩到 `dashboard / environments / eval`
- 不引入真实环境变量读取、自动切换或真实控制动作

## 验证

- `npm test` 通过，4 个测试文件、323 个测试全部通过
- `npm run build` 通过
- 默认 bootstrap input 与默认 mock providers 行为等价
- `providersBootstrapOptions` 仍高于 `providersBootstrapInput`
- 默认启动路径未新增真实 runtime bootstrap input 注入
