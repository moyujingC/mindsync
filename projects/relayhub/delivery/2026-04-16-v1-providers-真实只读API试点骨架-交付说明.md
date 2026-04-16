# RelayHub v1 Providers 真实只读 API 试点骨架交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-providers-真实只读API试点骨架-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-providers-真实只读API试点骨架-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` 真实只读 API 试点骨架交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- datasource 组合工厂 `createConsoleReadonlyDataSource`
- providers 试点骨架 `realProvidersDataSource.ts`
- providers source 可替换测试
- 默认 mock 行为保持不变

## 2. 本轮仍明确不做

当前仍未实现：

- 真实 HTTP 请求
- providers payload 向后端 wire format 命名迁移
- runtime 自动切换
- 页面层感知 providers 试点
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- 默认 datasource 组合
  - 全资源来自 mock
- providers 试点骨架
  - 仅替换 providers list/detail
- `consoleData.ts`
  - 继续通过 datasource 读取 raw contract
  - 继续通过 adapter 和 mapper 服务页面层

这意味着下一棒如果准备接真实 providers 只读 API，只需要把 stub 换成真实 providers datasource 实现，而不需要先改页面层或 service 对外接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 规划真实 providers datasource 的最小请求接口
2. 明确真实 providers 列表与详情的错误映射和空态映射
3. 再决定 providers 真实实现如何接入当前 datasource 组合工厂

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“首个可替换 datasource 的真实只读 API 试点骨架”阶段，下一棒更适合开始规划真实 providers 只读接口的最小接入。
