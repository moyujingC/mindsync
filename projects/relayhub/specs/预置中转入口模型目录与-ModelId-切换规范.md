# RelayHub v1：预置中转入口模型目录与 ModelId 切换规范

> 状态：current
> 版本：1.0.0
> owner：Architect / Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/specs/预置中转入口模型目录与-ModelId-切换规范.md
> supersedes：projects/relayhub/specs/2026-04-21-v1-中转入口可用模型列表拉取与-modelId-切换收口说明.md

## Summary

本规范定义 `RelayHub` 对系统预置中转入口的模型目录读取与 `modelId` 切换规则。

它负责说明：

- 什么时候允许读取上游模型目录
- 目录结果如何返回
- `modelId` 如何修改
- 哪些错误语义必须可操作

它不负责记录某一次交付或某一轮验证结果。

## 要解决的问题

中转入口的 `baseUrl` 与 `API Key` 正确，不代表默认 `modelId` 一定可用。

因此长期口径不是继续把预置入口默认写死在一个模型标识上，而是允许用户：

1. 先保存 `API Key`
2. 主动拉一次上游可用模型列表
3. 从列表中选择当前 `modelId`
4. 保存配置
5. 再显式测试连接
6. 测试通过后再去任务库绑定或切换

## 适用边界

本规范当前只覆盖：

- `relay-api`
- 系统预置中转入口
- `openai-compatible` catalog 家族

当前不扩展到：

- 所有官方模型入口
- 完整 provider 抽象层
- 完整上游目录长期持久化

## 固定决策

- 新增最小只读接口：`GET /models/:id/catalog`
- 拉到的列表只用于当前编辑会话，不持久化完整目录
- 预置入口继续锁定：
  - `kind`
  - `baseUrl`
- 预置入口的 `modelId` 采用“半锁定”规则：
  - 不允许自由手填
  - 只允许从刚拉到的可用模型列表中选择
- 保存配置不等于激活；仍需显式点击测试连接

## control-plane 规则

`GET /models/:id/catalog` 只对满足以下条件的条目生效：

- `source = preset`
- `kind = relay-api`
- `catalogFamily = openai-compatible`
- 已保存 `API Key`

服务端请求目标固定为：

- `<baseUrl>/models`

服务端使用该入口已保存的 `API Key` 注入：

- `Authorization: Bearer ...`

返回最小结构：

- `items: Array<{ id: string; label: string; supportedEndpointTypes?: string[] }>`
- `fetchedAt`

## 错误语义

`GET /models/:id/catalog` 失败时必须给出可操作错误：

- 缺少 `API Key`
  - 提示先补 `API Key`
- 条目不属于当前支持的中转预置入口
  - 提示当前仅支持中转预置入口
- 上游不可达
  - 提示上游暂时不可达
- 上游返回非 `2xx`
  - 保留核心状态码摘要
- 上游 `/models` 返回结构不合法
  - 明确提示当前无法识别可用模型列表

## 前端交互规则

在模型库编辑预置中转入口时：

- 拉取前：
  - 显示当前 `modelId`
  - 提示先获取可用模型，再切当前模型
- 拉取成功后：
  - 展示下拉选择控件
  - 仅列出刚返回的上游可用模型
  - 默认选中当前 `form.modelId`
- 保存后提示固定为：
  - 当前模型已更新，下一步请测试连接确认该入口当前模型是否可用

自定义入口继续维持当前行为：

- 可手填 `baseUrl`
- 可手填 `modelId`

## 测试口径

至少应验证：

- `GET /models/:id/catalog` 在有 `API Key` 的预置中转入口上能返回模型列表
- 缺少 `API Key` 时返回明确错误
- 非中转预置入口返回明确错误
- 上游非 `2xx` 时返回清楚错误摘要
- 上游返回结构不合法时返回清楚错误
- 前端可展示刚拉到的模型列表
- `modelId` 只能从刚拉到的列表中切换

## 历史来源

本规范由以下日期文档收束而来：

- [2026-04-21-v1-中转入口可用模型列表拉取与-modelId-切换收口说明.md](./2026-04-21-v1-中转入口可用模型列表拉取与-modelId-切换收口说明.md)

