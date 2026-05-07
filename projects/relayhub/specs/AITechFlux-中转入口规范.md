# RelayHub v1：AITechFlux 中转入口规范

> 状态：current
> 版本：1.0.0
> owner：Architect / Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/specs/AITechFlux-中转入口规范.md
> supersedes：projects/relayhub/specs/2026-04-21-v1-AITechFlux-中转入口预置接入说明.md

## Summary

本规范定义 `RelayHub` 中 `AITechFlux` 作为系统预置中转入口的长期稳定口径。

它负责说明：

- 这个入口在产品里的定位
- 哪些字段固定锁定
- 用户允许做哪些操作
- 与控制面、前端展示和测试口径如何对齐

它不负责描述某一轮实施细节、交付记录或单次联调结果。

## 定位

`AITechFlux` 在 `RelayHub` 中固定定位为：

- `relay-api` 类型的系统预置中转入口
- 面向开发工作流的可复用接入入口
- 用户主要通过补 `API Key`、测试连接、再去任务库绑定的方式使用

本规范目标不是把它扩成“一个入口下长期维护完整模型目录”，而是先把“可稳定接入、可稳定配置、可稳定被任务绑定”的主路径写清楚。

## 固定决策

- `baseUrl` 固定为 `https://aitechflux.com/v1`
- `purchaseUrl` 固定为 `https://aitechflux.com/`
- 条目类型固定为 `relay-api`
- 条目来源固定为系统预置入口
- 页面继续锁定预置入口的 `kind` 与 `baseUrl`

关于 `modelId`：

- 历史上曾固定为 `claude-sonnet`
- 当前长期口径不再要求写死某一个默认 `modelId`
- `modelId` 的选择规则以下一份 canonical 文档
  - [预置中转入口模型目录与 ModelId 切换规范](./预置中转入口模型目录与-ModelId-切换规范.md)
  - 为准

## 入口数据要求

系统预置的 `AITechFlux` 条目应保持以下稳定字段：

- `id: preset-aitechflux-relay`
- `kind: relay-api`
- `source: preset`
- `catalogFamily: openai-compatible`
- `baseUrl: https://aitechflux.com/v1`
- `purchaseUrl: https://aitechflux.com/`

可按产品需要继续维护轻量引导字段，例如：

- `presetPriority`
- `recommendedTaskCategories`
- `recommendedTaskIds`
- `selectionReason`
- `activationHint`
- `costTier`
- `capabilityTags`

## 页面与控制面约束

在模型库 `models` 主路径中，`AITechFlux` 应作为系统预置入口展示。

对该入口：

- 用户不允许改写：
  - `kind`
  - `baseUrl`
- 用户允许：
  - 补 `API Key`
  - 保存配置
  - 拉取可用模型列表
  - 从可用列表中选择当前 `modelId`
  - 测试连接
  - 停用 / 启用

当前不要求：

- 新增独立的 provider 抽象层
- 把完整上游模型目录长期持久化到本地状态

## 测试口径

至少应验证：

- `/models` 中可看到 `AITechFlux` 预置入口
- 预置条目展示购买 / 开通入口
- 编辑时 `kind` 与 `baseUrl` 锁定
- 用户可补 `API Key`
- 用户可继续走“获取可用模型 -> 选择 `modelId` -> 保存 -> 测试连接”的路径
- `GET /models` 返回新增条目
- `PATCH /models/:id` 不允许改写该条目的 `kind` / `baseUrl`

## 历史来源

本规范由以下日期文档收束而来：

- [2026-04-21-v1-AITechFlux-中转入口预置接入说明.md](./2026-04-21-v1-AITechFlux-中转入口预置接入说明.md)

