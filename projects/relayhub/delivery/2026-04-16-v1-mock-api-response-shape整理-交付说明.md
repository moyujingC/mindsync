# RelayHub v1 mock API response shape 整理交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-mock-api-response-shape整理-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-mock-api-response-shape整理-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 mock API response shape 整理结果交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- mock API 统一 envelope：`meta + items / item / overview`
- service 层统一解包
- `consoleData` service 级自动化测试
- 原有路由回归继续保持通过

## 2. 本轮仍明确不做

当前仍未实现：

- 真实只读 API
- schema codegen
- 页面层直接消费 API response
- 写操作按钮或真实控制动作
- E2E 浏览器测试

## 3. 当前结构意图

当前前端数据链路已经形成：

- `fixtures/`
  - 原始本地数据
- `mocks/`
  - 更接近未来只读接口的 response envelope
- `services/`
  - 页面稳定消费层与解包层
- `pages/`
  - 继续只感知稳定 view model

这意味着下一棒如果继续推进数据契约，优先应该动 `mocks/` 与 `services/`，而不是重新改页面骨架。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 为 `meta` 增加更明确的分页 / 过滤 / 版本语义占位
2. 继续补 `Providers` 查询参数交互测试
3. 再决定是否引入更贴近真实 API 的 contract 文件

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 mock API 和页面消费层分得更清楚，下一棒更适合继续整理只读契约，而不是再回头补核心页面基础能力。
