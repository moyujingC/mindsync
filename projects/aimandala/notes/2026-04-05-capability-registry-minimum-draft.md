# CapabilityRegistry 最小对象草案

> 状态：draft
> 版本：0.1.0
> owner：Architect
> last_updated：2026-04-05
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/notes/2026-04-05-capability-registry-minimum-draft.md
> 项目：aimandala
> 阶段：discussion

## 1. 一句话结论

当前 `CapabilityRegistry` 只应该回答一个问题：

**平台当前有哪些能力，以及在当前用户状态下哪些能力可进入。**

它不是插件系统，不是执行框架，也不是配置中心。

## 2. 为什么当前需要它

现在真正的问题不是“有没有很多能力”，而是：

1. 解释能力、报告问答、后续对话、计划、绘画这些语义正在混在页面层
2. 如果不先抽出最小能力清单，后续每加一个入口都会继续堆在 `mobile-web`
3. 未来 `Conversation` 长出来时，容易反过来推翻当前命名和边界

因此当前需要一个轻量注册表，先把能力对象钉住。

## 3. 当前职责

`CapabilityRegistry` 当前只负责：

1. 声明能力域清单
2. 声明能力当前状态
3. 声明能力在哪些渠道可用
4. 声明能力进入条件
5. 为旅程推荐和渠道入口提供统一查询结果

## 4. 当前不负责什么

`CapabilityRegistry` 当前不负责：

1. 执行能力逻辑
2. 管理插件生命周期
3. 做动态加载或热插拔
4. 承担完整权限系统
5. 承担计费系统
6. 承担配置中心

一句话说，它是**能力目录**，不是**能力平台运行时**。

## 5. 当前建议登记的 capability

当前建议只登记四个：

1. `interpretation`
2. `conversation`
3. `planning`
4. `drawing`

当前状态建议如下：

1. `interpretation`
   - `enabled`
   - 当前正式上线主能力
   - 包含 `Pro report chat` 作为内置子能力
2. `conversation`
   - `planned` 或 `hidden`
   - 当前不独立上线
3. `planning`
   - `planned`
4. `drawing`
   - `planned`

当前不要把下面这些升成一级 capability：

1. 安全与风控
2. 运营
3. 成长沉淀

它们当前更适合视为横切约束或后续支撑层议题。

## 6. 最小对象字段

当前每个 capability 只建议保留下面这些字段：

1. `id`
2. `status`
3. `title`
4. `availableChannels`
5. `requires`
6. `canEnter(snapshot)`

如果需要再多加一个字段，建议优先加：

7. `entryHint`

用于给渠道层返回轻量入口提示，而不是把整套文案都塞进注册表。

## 7. 字段含义建议

### 7.1 `id`

稳定标识符，例如：

- `interpretation`
- `conversation`
- `planning`
- `drawing`

### 7.2 `status`

当前建议只保留三档：

1. `enabled`
2. `hidden`
3. `planned`

先不要做更复杂的生命周期枚举。

### 7.3 `availableChannels`

标记当前能力在哪些渠道允许进入，例如：

- `mobile-web`
- `miniapp`
- `native-app`

### 7.4 `requires`

仅表达最小依赖，不表达复杂工作流。

例如：

1. `conversation` 未来可以依赖 `interpretation`
2. `planning` 未来可以依赖 `conversation` 或 `interpretation`

### 7.5 `canEnter(snapshot)`

用于判断当前用户在当前状态下是否可以进入该能力。

当前它只应做轻量判断，例如：

1. 是否已有本次报告
2. 是否是 Pro 用户或已升级 Pro
3. 当前渠道是否开放

先不要让它承担复杂规则引擎。

## 8. 与 JourneyEngine 的关系

两者当前关系应明确分开：

1. `CapabilityRegistry`
   - 回答“有什么能力、能不能进”
2. `JourneyEngine`
   - 回答“当前更推荐走哪一步”

也就是说：

1. 注册表负责能力可用性
2. 旅程引擎负责推荐顺序

不要把两者混成一个对象。

## 9. 与 Pro report chat 的关系

当前需要特别钉住一点：

1. `Pro report chat` 不是一级 capability
2. 它当前属于 `interpretation` 的内置子能力
3. 它是否可进入，应由 `interpretation` 当前状态与报告上下文共同决定

只有当未来 `Conversation` 真正独立出报告页后，才评估是否把它迁为独立 capability 入口。

## 10. 建议的数据结构示意

```ts
export type CapabilityId =
  | "interpretation"
  | "conversation"
  | "planning"
  | "drawing";

export type CapabilityStatus = "enabled" | "hidden" | "planned";

export type ChannelId = "mobile-web" | "miniapp" | "native-app";

export type JourneySnapshot = {
  hasReport?: boolean;
  reportTier?: "lite" | "pro";
  currentChannel: ChannelId;
};

export type CapabilityDefinition = {
  id: CapabilityId;
  title: string;
  status: CapabilityStatus;
  availableChannels: ChannelId[];
  requires?: CapabilityId[];
  entryHint?: string;
  canEnter(snapshot: JourneySnapshot): boolean;
};

export interface CapabilityRegistry {
  list(): CapabilityDefinition[];
  get(id: CapabilityId): CapabilityDefinition | undefined;
  getAvailable(snapshot: JourneySnapshot): CapabilityDefinition[];
}
```

## 11. 当前不建议走到哪一步

为了避免滑向插件平台，当前不建议继续扩展为：

1. `register()` 动态自注册机制
2. 符号链接外部能力包
3. 每个 capability 单独 `config.json`
4. `initialize / execute / health` 统一运行时接口
5. capability marketplace

这些都不是当前阶段的必要复杂度。

## 12. 当前最小成功标准

如果 `CapabilityRegistry` 达到下面四点，就算足够：

1. 团队对当前 capability 清单说法一致
2. `mobile-web` 不再自己硬编码整套平台语义
3. `Pro report chat` 的归属不再模糊
4. 后续 `Conversation` 接入时不需要重画整张平台图
