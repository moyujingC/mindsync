# RelayHub v1 Readonly API adapter 层交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/delivery/2026-04-16-v1-readonly-api-adapter层-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-16-v1-readonly-api-adapter层-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Readonly API adapter` 层抽离结果交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- 独立的 `readonlyApiAdapters.ts`
- overview / collection / detail 三类基础适配函数
- `consoleData.ts` 改为复用 adapter 层
- adapter 层独立测试已补齐

## 2. 本轮仍明确不做

当前仍未实现：

- 真实只读 API
- payload 字段向后端 wire format 命名迁移
- 页面层直接消费 `ReadonlyApiResponse`
- `Contract*` 与 `ReadonlyApi*` 的收敛
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成更清晰的只读适配链路：

- `mockApi`
  - 返回当前 `Contract*` response
- `readonlyApiAdapters`
  - 承接 `Contract* -> ReadonlyApiResponse`
- `consoleData.ts`
  - 承接资源级 raw helper
  - 承接页面 view model 解包 helper

这意味着下一棒如果准备接真实只读 API，可以优先替换 adapter 上游或新增数据源实现，而不需要先动页面层。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 评估真实只读 API 接入时，adapter 层与 mock 层的切换接口
2. 评估哪些资源先接真实只读 API，哪些继续保留 mock
3. 再决定 `Contract*` 与 `ReadonlyApi*` 的长期收敛策略

## 5. 一句话结论

当前 `RelayHub` 控制台已经把只读 API 的基础 envelope 适配抽成独立 adapter 层，下一棒更适合开始做真实只读 API 接入准备，而不是再继续补 service 内部整理。
