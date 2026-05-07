# RelayHub v1 Providers runtime 数据源入口交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/delivery/2026-04-16-v1-providers-runtime数据源入口-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-16-v1-providers-runtime数据源入口-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` runtime 数据源入口交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- providers 独立 runtime 数据源入口
- `mock / real-fetch` 两种 runtime mode
- providers 默认拼装改经由 runtime seam 走
- 显式 `providersSource` 覆盖优先级验证

## 2. 本轮仍明确不做

当前仍未实现：

- 环境变量接入
- runtime 自动切换
- 认证头字段决策
- 其他资源的 runtime seam
- 页面层感知 runtime mode
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- 默认 datasource 组合
  - providers 默认仍来自 mock
- providers 真实试点链路
  - runtime seam 决定使用 mock 或 real-fetch
  - real-fetch 继续复用 fetch transport factory 与 facade
- `consoleData.ts`
  - 继续通过 datasource 读取 raw contract
  - 对页面层保持稳定 helper，不暴露 runtime seam 细节

这意味着下一棒如果要接真实 providers 只读 API，不需要先改页面层或 `consoleData` 对外接口，只需要把 runtime seam 接到正式的 runtime 配置入口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 决定 providers real-fetch mode 的正式 runtime 配置入口
2. 明确真实 base URL 与认证方式如何注入 fetch transport config
3. 再确认是否需要把 runtime seam 扩展到其他资源

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但结构上已有默认关闭的 runtime 数据源入口”的阶段，下一棒可以直接进入真实 runtime 配置与只读 API 接入准备。
