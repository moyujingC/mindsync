# RelayHub v1 Providers 真实 transport 与 wire adapter 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/delivery/2026-04-16-v1-providers-真实transport与wire-adapter-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-16-v1-providers-真实transport与wire-adapter-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` 真实 transport 与 wire adapter 交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- providers 独立 transport 层
- providers collection / detail wire adapter
- `createRealProvidersReadonlyDataSource(...)` 的三层编排结构
- transport / adapter / facade 相关自动化测试

## 2. 本轮仍明确不做

当前仍未实现：

- 真实 base URL 与环境变量配置
- 真实 HTTP 请求接入
- 认证头与 runtime 自动切换
- payload 向后端正式 wire format 命名迁移
- 页面层感知 transport 或 wire payload
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- 默认 datasource 组合
  - providers 继续来自 mock source
- providers 真实试点分层
  - transport 负责请求语义
  - wire adapter 负责 body 到 payload contract 的映射
  - facade 负责 contract meta 与 `ready / empty / not-found` 语义
- `consoleData.ts`
  - 继续通过 datasource 读取 raw contract
  - 对页面层保持稳定 helper，不暴露 transport 与 adapter 细节

这意味着下一棒如果要接真实 providers 只读 API，只需要补 transport 实现和真实 DTO 映射，而不需要先改页面层、路由层或 `consoleData` 对外接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 明确真实 providers 列表与详情接口的 base URL 和认证方式
2. 确认真实返回字段到当前 wire adapter / payload contract 的映射关系
3. 再决定是否为 providers 增加默认关闭的 runtime 切换入口

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但真实 transport 与 wire adapter 接缝已独立”的阶段，下一棒可以直接进入真实只读 API 的接入准备。
