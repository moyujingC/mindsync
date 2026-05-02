# RelayHub v1：AITechFlux 中转入口预置接入说明

## Summary

本轮把 `AITechFlux` 正式接入为 `RelayHub` 的系统预置入口，定位固定为 `中转入口（relay-api，中转 API）`。

目标不是扩成“一个入口下多模型目录”，而是在当前既有 `ModelEntry` 结构下新增一个可复用入口，让用户直接补 `API Key` 即可启用。

固定决策：

- `baseUrl` 固定为 `https://aitechflux.com/v1`
- `purchaseUrl` 固定为 `https://aitechflux.com/`
- `modelId` 固定为 `claude-sonnet`
- 条目类型固定为 `relay-api`
- 页面继续锁定预置入口的 `kind`、`baseUrl`、`modelId`

## Key Changes

### 1. 预置入口数据补齐

- 前端 mock 数据与 control-plane 服务端种子数据同时新增 `AITechFlux 中转`
- 条目固定为：
  - `id: preset-aitechflux-relay`
  - `kind: relay-api`
  - `source: preset`
  - `catalogFamily: openai-compatible`
  - `baseUrl: https://aitechflux.com/v1`
  - `modelId: claude-sonnet`
  - `purchaseUrl: https://aitechflux.com/`
- 初始状态为 `preset-unconfigured`
- 默认提示语义为：
  - 这是一个可复用入口
  - 只需补 `API Key`
  - 测试连接成功后可去任务库绑定

### 2. 预置引导字段

- 为 `AITechFlux` 补齐现有轻量引导字段：
  - `presetPriority`
  - `recommendedTaskCategories`
  - `recommendedTaskIds`
  - `selectionReason`
  - `activationHint`
  - `costTier`
  - `capabilityTags`
- 推荐口径固定偏 `通用工具`，优先适配：
  - `Claude Code Web Coding`
  - `Codex Repo Coding`
- 选择理由固定为：
  - “第三方中转入口，可复用 URL + Key，并在工具内切换默认模型。”

### 3. 页面与控制面约束

- `/models` 中把 `AITechFlux` 作为系统预置入口展示
- 编辑时继续锁定：
  - `kind`
  - `baseUrl`
  - `modelId`
- 用户只允许：
  - 补 `API Key`
  - 保存配置
  - 测试连接
  - 停用 / 启用
- 不新增 control-plane 路由
- 继续复用现有 `POST /models/:id/test` 状态机和错误语义

## Test Plan

- `/models` 可看到 `AITechFlux` 预置入口
- 预置条目显示购买 / 开通入口
- 编辑时 `baseUrl`、`modelId`、`kind` 均锁定
- 测试连接成功后，提示“可去任务库绑定默认模型”
- `GET /models` 返回新增条目
- `PATCH /models/:id` 不允许改写该条目的 `baseUrl` / `modelId` / `kind`

## Assumptions

- 当前数据模型仍是“一个入口 + 一个默认 modelId”
- 本轮不做入口内多模型目录发现
- 本轮不写入真实密钥，不把用户曾提供的旧密钥放入任何仓库文件
