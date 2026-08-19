# AI Skill、MCP、Plugin 对比分析

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-04
> source_of_truth：company/knowledge-base/system/AI-Skill-MCP-Plugin-对比分析.md

这份文档用于全面对比 `skill`、`MCP`、`plugin` 在 AI 工具生态中的职责边界、组合方式和治理方法。

它衔接三篇机制文档：

- [AI-Skill-系统性讨论.md](./AI-Skill-系统性讨论.md)
- [AI-MCP-系统性讨论.md](./AI-MCP-系统性讨论.md)
- [AI-Plugin-系统性讨论.md](./AI-Plugin-系统性讨论.md)

## 1. 一句话区分

三者最简单的区别是：

- `skill`：让 AI 按团队流程做事
- `MCP`：让 AI 标准化连接外部系统
- `plugin`：把一组能力打包安装和分发

对应比喻：

| 概念 | 比喻 | 主要解决的问题 |
|---|---|---|
| skill | AI 团队 SOP（标准作业流程）/ 操作手册 | 这件事应该怎么做 |
| MCP | AI 连接外部系统的 USB-C 接口 | AI 怎么连到外部数据和工具 |
| plugin | 可安装的工具箱 | 如何把能力打包、共享、更新 |

## 2. 核心职责对比

| 维度 | Skill | MCP | Plugin |
|---|---|---|---|
| 本质 | 流程和方法封装 | 连接协议 | 能力分发包 |
| 关注点 | 怎么做 | 怎么连接 | 怎么安装和共享 |
| 主要对象 | AI agent 的行为 | 外部系统的资源和工具 | 一组可安装能力 |
| 典型内容 | 触发条件、步骤、质量标准 | tools、resources、prompts | skills、MCP、agents、hooks、配置 |
| 是否执行动作 | 通常指导 AI 执行 | 可以暴露可调用工具 | 取决于打包内容 |
| 是否连接外部系统 | 可以说明怎么用连接 | 专门负责连接 | 可以包含连接能力 |
| 是否适合团队治理 | 很适合 | 很适合，但偏基础设施 | 很适合，偏分发与版本 |
| 主要风险 | 触发混乱、规则冲突 | 权限、数据外泄、工具误调用 | 供应链、权限、版本漂移 |

## 3. 分别适合什么时候用

### 3.1 要流程，用 skill

当你的问题是：

- AI 输出不稳定
- 同一任务每次格式不同
- 团队规则总要重复解释
- agent 经常跳过关键步骤
- 需要固定交付标准

优先考虑 skill。

例子：

- 研究结论怎么转成内容
- PRD（产品需求文档）怎么写
- 发布前怎么做 QA
- 外部资料怎么做事实核查
- 客户简报应该按什么结构生成

### 3.2 要连接，用 MCP

当你的问题是：

- AI 需要读取外部系统
- AI 需要调用外部工具
- 多个 AI 客户端都需要接同一个系统
- 外部系统访问需要权限和审计
- 需要把内部 API 暴露给 AI 使用

优先考虑 MCP。

例子：

- 让 AI 读取 GitHub PR
- 让 AI 查询内部数据库
- 让 AI 访问 Figma 设计稿
- 让 AI 查询客户使用数据
- 让 AI 调用任务系统 API

### 3.3 要分发，用 plugin

当你的问题是：

- 一组能力要被团队共享
- 同一套配置要跨项目复用
- 需要版本化发布和升级
- 需要把 skill、MCP、agent 打包在一起
- 需要进入内部或外部插件市场

优先考虑 plugin。

例子：

- 公司工程工作流插件
- 内容团队插件
- GitHub 协作插件
- 研究中心插件
- 某个产品线专用插件

## 4. 三者如何组合

三者不是竞争关系，而是分层关系。

### 4.1 Plugin 可以打包 skill

一个内容团队插件可以包含：

- 选题 skill
- 改稿 skill
- 品牌语气检查 skill
- 发布前检查 skill

这里 plugin 负责安装和更新，skill 负责具体流程。

### 4.2 Plugin 可以打包 MCP

一个 GitHub 插件可以包含：

- GitHub MCP connector
- PR 分析 skill
- CI 修复 skill
- 发布 PR 的命令或 agent

这里 plugin 负责分发，MCP 负责连接 GitHub。

### 4.3 Skill 可以教 AI 怎么用 MCP

MCP 只告诉 AI 有哪些工具可调用。

skill 可以规定使用顺序。

例如客户简报流程：

1. 通过 CRM MCP 查询客户信息
2. 通过数据平台 MCP 查询用量
3. 通过工单 MCP 查询未解决问题
4. 按团队模板生成简报
5. 标出缺失数据和风险

这就是 skill + MCP 的组合。

### 4.4 MCP 不替代 skill

有了 MCP，AI 只是多了连接能力。

它仍然可能不知道：

- 什么时候该查哪个系统
- 查到冲突数据时信谁
- 哪些字段不能写进对外材料
- 输出应该是什么格式

这些需要 skill 约束。

### 4.5 Plugin 不替代 MCP

plugin 可以安装连接能力，但连接本身仍然需要协议或 connector。

如果目标是标准化连接外部系统，MCP 或其他正式 connector 仍然是核心。

### 4.6 Plugin 不替代 skill

plugin 可以包含一堆能力，但不一定有清晰流程。

如果插件只是把很多工具堆在一起，AI 仍然会不知道怎么选。

真正好的 plugin，通常会同时包含：

- 连接能力
- 工作流 skill
- 权限说明
- 默认配置
- 试跑样本

## 5. 决策规则

可以用下面的判断顺序。

### 5.1 第一问：问题是流程不稳定吗

如果是，先做 skill。

典型症状：

- 输出格式不稳定
- AI 经常跳步骤
- 团队规则反复解释
- 同一类任务返工多

### 5.2 第二问：问题是连不到外部系统吗

如果是，考虑 MCP。

典型症状：

- 需要实时数据
- 需要读取 SaaS 系统
- 需要写回外部系统
- 手动复制粘贴成本高

### 5.3 第三问：问题是能力难以共享吗

如果是，考虑 plugin。

典型症状：

- 多项目都要同一套能力
- 团队成员配置不一致
- skill 和 connector 分散安装
- 升级和回滚没有路径

### 5.4 常用组合判断

| 需求 | 推荐组合 |
|---|---|
| 让 AI 按公司格式写周报 | skill |
| 让 AI 读取 Google Drive 文件 | MCP 或 app connector |
| 让 AI 读取 Drive 后按公司格式写周报 | skill + MCP |
| 把“周报流程 + Drive 连接 + 模板”发给团队 | plugin |
| 给工程团队统一 PR 审查、CI 修复和 GitHub 连接 | plugin + skill + MCP |

## 6. 常见误区

### 6.1 把 skill 当插件市场

skill 不是越多越好。

低质量、重叠或触发不清的 skill 会让 AI 行为变乱。

skill 应该从团队真实工作流中沉淀，而不是批量下载堆起来。

### 6.2 把 MCP 当万能能力

MCP 让 AI 能连接外部系统，但不保证 AI 会正确使用系统。

如果没有流程约束，AI 可能会：

- 查错系统
- 漏掉关键数据
- 调用不该调用的工具
- 把外部数据中的恶意指令当真

MCP 需要 skill 和权限治理配套。

### 6.3 把 plugin 当能力质量认证

能安装不等于可信。

plugin 可能带来：

- 过宽权限
- 过时 skill
- 隐性流程假设
- 供应链风险
- 和团队规则冲突的默认行为

plugin 需要像代码依赖一样治理。

### 6.4 用 plugin 掩盖流程不清

如果团队流程本身不清楚，把它打包成 plugin 只会扩大混乱。

正确顺序是：

1. 先用真实任务验证流程
2. 再沉淀 skill
3. 需要连接外部系统时接 MCP
4. 需要跨团队分发时做 plugin

## 7. 团队治理方式

### 7.1 Skill 治理

关注：

- 触发条件
- 适用边界
- 输出格式
- 质量标准
- 真实任务试跑

核心问题是：它有没有让 AI 更稳定地做对事。

### 7.2 MCP 治理

关注：

- 暴露哪些 resources
- 暴露哪些 tools
- 是否有写权限
- 是否需要用户确认
- 是否有审计日志
- 是否有访问控制

核心问题是：它有没有安全、最小化地连接外部系统。

### 7.3 Plugin 治理

关注：

- 打包了哪些能力
- 谁维护
- 版本怎么升级
- 能否回滚
- 是否有命名空间
- 是否适合进入核心能力集

核心问题是：它有没有让能力更容易被安装、共享和维护。

## 8. 推荐建设顺序

对一个刚开始建设 AI 团队能力体系的组织，建议顺序是：

1. 先沉淀 3 到 5 个核心 skill
2. 用真实任务测试 skill 是否减少返工
3. 找出最需要连接的外部系统
4. 对高频、长期、权限清晰的系统接 MCP
5. 把稳定 skill 和连接能力打包成内部 plugin
6. 建立版本、权限、回归和废弃机制

不要从插件市场批量安装开始。

那会让 AI 看起来能力变多，但组织行为更难治理。

## 9. 最小能力地图

一个成熟 AI 团队可以这样分层：

```text
团队规则层：AGENTS.md / 组织原则 / 项目边界
流程能力层：skill
连接能力层：MCP / app connector
分发治理层：plugin
执行运行层：agent / automation / scheduler
知识沉淀层：knowledge base / docs / delivery
```

这几层不应该混在一起。

如果把所有规则都塞进 plugin，plugin 会过重。

如果把所有外部连接都写进 skill，skill 会变成脆弱脚本说明。

如果把所有流程都交给 MCP，MCP 会超出协议职责。

## 10. 核心结论

skill、MCP、plugin 的分工可以收束成一句话：

> 要流程用 skill，要连接外部系统用 MCP，要分发整套能力用 plugin。

三者最稳的组合方式是：

- skill 定义工作方式
- MCP 提供外部连接
- plugin 负责安装和版本化

真正成熟的 AI 团队，不是拥有很多 skill、很多 MCP、很多 plugin，而是知道每一层能力解决什么问题，并且让它们各自保持边界清楚、权限明确、可测试、可维护。

## 11. 参考来源

- [AI-Skill-系统性讨论.md](./AI-Skill-系统性讨论.md)
- [What is the Model Context Protocol (MCP)?](https://modelcontextprotocol.io/docs/getting-started/intro)
- [MCP Architecture](https://modelcontextprotocol.io/specification/2024-11-05/architecture)
- [Claude Code: Create plugins](https://code.claude.com/docs/en/plugins)
- [OpenAI Academy: Plugins and skills](https://openai.com/academy/codex-plugins-and-skills/)