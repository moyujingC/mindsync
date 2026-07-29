<video src="https://media001.geekbang.org/c09dc5553ef571f1b28f5017f0e90402/c142c2d4d6d3462daf3eef9b54b9e86a-fcce375c0ec9160b116e5228a36946f9-sd.m3u8" controls="">Sorry, your browser doesn't support embedded videos.</video>

00:00 / 00:00

1.0x

- 3.0x
- 2.5x
- 2.0x
- 1.5x
- 1.25x
- 1.0x
- 0.75x
- 0.5x

网页全屏

全屏

00:00

### 场景一：后端跑通——从 Entity 到 Controller

目标：展示 Provider 模块后端的交付节奏，重点演示几个有代表性的任务，最后用 curl 验证全部接口。

第一步：确认数据模型，更新 schema.sql

指令：

按照以下数据模型，在 schema.sql 中新增三张表：

provider（含 auth\_config JSON 字段）、

model\_config（含 name 和 model\_id 分开存）、

provider\_health（独立表，含 fail\_count、latency\_ms、last\_success\_at）。

要点：

展示三张表的核心设计决策：auth\_config 用 JSON（不同供应商鉴权结构不同）、provider\_health 独立成表（高频写不竞争锁）

更新完 schema.sql，用 mock profile 启动验证建表成功

第二步：Entity + Mapper

指令：

按照 CLAUDE.md 规范和 schema.sql 的表结构，在 hify-provider 中创建

Provider、ModelConfig、ProviderHealth 的 Entity 和 Mapper。

Entity 继承 BaseEntity（ProviderHealth 除外），Mapper 继承 BaseMapper。

auth\_config 和 extra\_params 字段用 JacksonTypeHandler。

要点：

这个任务很干净，Claude Code 基本不出错

review 重点：@TableName(autoResultMap = true) 有没有加、JSON 字段的 TypeHandler 有没有对上

第三步：Service——连通性测试（重点演示）

指令：

在 hify-provider 中实现连通性测试。根据 provider.type 分发：

OPENAI 和 OPENAI\_COMPATIBLE 调 GET /v1/models（Bearer Token），

OLLAMA 调 GET /api/tags（无认证）。

统一返回 ConnectionTestResult（success、latencyMs、modelCount、errorMessage）。

使用 LlmHttpClient，超时 10 秒。

要点：

第四步：Controller + curl 验收

指令：

在 hify-provider 中创建 ProviderController，实现所有接口：

POST 创建、GET 列表（分页）、GET 详情（含 modelConfig 和 health）、

PUT 更新、DELETE 删除、POST /{id}/test-connection。

所有接口返回 Result\<T>，入参加 @Valid 校验。

curl 验收：

curl -X POST http://localhost:8080/api/v1/providers \\

\-H "Content-Type: application/json" \\

\-d '{

"name": "OpenAI",

"type": "OPENAI",

"baseUrl": "https://api.openai.com",

"authConfig": {"apiKey": "sk-xxx"}

}'

curl -X POST http://localhost:8080/api/v1/providers/1/test-connection

curl http://localhost:8080/api/v1/providers/1

curl "http://localhost:8080/api/v1/providers?page=1&pageSize=10"

要点：

展示 test-connection 响应：latencyMs 有值、modelCount 是真实拉取的数量

展示详情接口：modelConfigs 列表里有真实模型、providerHealth.status 变成 UP

展示分页列表：PageResult 结构正确，total 和 list 都在

### 场景二：前端对接——mock 换成真实 API

目标：把 11 讲做的 ProviderList mock 页面接上真实后端，走完浏览器完整验收。

第一步：创建前端 API 文件

指令：

在 hify-web/src/api/provider.ts 中创建 API 方法：

getProviderList（分页，参数 page/pageSize/type/enabled）、

createProvider、updateProvider、deleteProvider、testConnection。

类型定义和后端 DTO 字段对齐。

要点：

展示生成的 provider.ts，说明返回类型直接写业务数据类型，不需要包 Result\<T>——request.ts 拦截器已经自动解包了

列表接口返回 PageResult\<Provider>，对应后端解包后的 data 字段

第二步：页面对接——mock 换成 API

指令：

把 ProviderList.vue 的 mock 数据换成真实 API 调用。改动点：

1\. HifyTable 的 api prop 从 mock 函数换成 getProviderList

2\. HifyFormDialog 的 submit 事件处理换成 createProvider/updateProvider

3\. 删除按钮的 useConfirm 换成 deleteProvider

4\. 操作列加"连通性测试"按钮，点击调 testConnection，结果用 ElMessage 提示

5\. 加"健康状态"列：UP 绿色 tag、DOWN 红色 tag、DEGRADED 黄色 tag、UNKNOWN 灰色 tag，显示最近延迟 ms

6\. 加"模型数"列：显示该供应商下已启用的模型数量

要点：

展示改动量：API 文件是新增的，ProviderList.vue 改动很小，组件结构没有动

重点说明 HifyTable 的 api prop 换了一行，分页、loading、空状态全部自动处理——这是 11 讲封装前端组件的回报

展示健康状态 tag 的颜色配置：UNKNOWN 灰色是还没测过，不要用红色表示禁用，禁用是正常状态

第三步：浏览器完整验收

操作顺序：

![](https://static001.geekbang.org/resource/image/36/31/3600cdd08be5aa21b716cce02e9d5a31.png?wh=3250x1754) ![](https://static001.geekbang.org/resource/image/1f/3e/1f9ba70fa32be2020aae40eb2868783e.png?wh=3282x580) ![](https://static001.geekbang.org/resource/image/68/da/68e120e7d52bc9a8b8d36yy2630e20da.png?wh=3280x1136)

打开 http://localhost:5173，进入“模型管理”，看到空列表

点“新增提供商”，填入 OpenAI 信息（名称、类型 OPENAI、baseUrl、API Key），提交

列表刷新，出现一条记录，健康状态显示灰色 UNKNOWN

点“连通性测试”，ElMessage 提示成功，健康状态变成绿色 UP，延迟列显示毫秒数

点模型数查看详情，看到从 OpenAI 拉取的真实模型列表

再添加一个 Ollama Provider（类型 OLLAMA，baseUrl http://localhost:11434），测试连通

再添加一个 DeepSeek（类型 OPENAI\_COMPATIBLE，baseUrl https://api.deepseek.com），验证兼容类型开箱即用

编辑、删除的常规操作验收

等一分钟，查 MySQL 的 provider\_health 表 last\_check\_at，确认定时任务在自动探测

要点：

重点说明第 6、7 步：Ollama 和 DeepSeek 接入路径完全不同，但在同一套管理界面里，体现“一套管理，多种供应商”的设计价值

curl 在场景一里已经验证了接口通，浏览器验收是确认整条链路通，包括 Nginx 代理、前端渲染、状态更新

### 场景三：把经验变成 Skill

目标：演示 14 讲的 Skill 沉淀过程。Provider 模块做完了，把这次的流程教给 Claude Code，让它以后自动按这个流程走。

第一步：让 Claude Code 教你 Skill 是什么

指令：

Claude Code 的 Skill 机制是什么？

怎么创建、怎么使用、和 CLAUDE.md 有什么区别？

要点：

展示它的回答：Skill 是.claude/skills/ 目录下的 Markdown 文件，定义特定任务的操作流程

CLAUDE.md 是全局规范（每次对话自动加载），Skill 是任务手册（引用时才生效）

强调：不需要去翻文档，问它自己就教你——这是咨询模式的又一个应用场景

第二步：把 Provider 模块的交付流程沉淀成 Skill

指令：

我刚完成了 Hify 项目 Provider 模块的开发，流程是这样的：

1\. 先用咨询模式梳理供应商选型、数据模型设计、边界问题

2\. 数据模型确定后更新 schema.sql

3\. 后端按 MVC 分层拆解：Entity+Mapper → DTO → Service → Controller

4\. 每步编译或 curl 验证通过再进下一步

5\. 前端对接：创建 API 文件，把 mock 数据源换成真实 API

6\. 完整验收：后端 curl + 浏览器全流程

帮我把这个流程沉淀成.claude/skills/module-delivery.md。

要求：每一步有明确的产出物和验证方式，关键决策点标注"等待用户确认"，

把我踩过的坑写成注意事项。

要点：

打开生成的 module-delivery.md，展示它的结构

review 三件事：产出物是否明确（不是“做需求分析”，而是“产出包含 DDL 的需求文档”）、决策点是否标注“等待用户确认”、坑是否写进去了

展示 review 后手动补进去的一条注意事项：JSON 字段必须用 @TableName(autoResultMap = true) + JacksonTypeHandler，否则反序列化为 null——这是这次真实踩过的

第三步：用 Skill 启动下一个模块，验证效果

指令：

按模块交付 Skill 的流程，帮我做 Agent 管理模块。先从第一步开始。

要点：

对比演示：没有 Skill 时，要手写一大段流程描述，“先帮我分析需求，然后设计数据模型，然后按 Entity、DTO、Service、Controller 的顺序拆解……” 有了 Skill，一句话启动

展示 Claude Code 自动按 Skill 的流程走，在数据模型设计完后停下来，标注“等待用户确认”

说明 Skill 也需要迭代：做完 Agent 模块，发现 Skill 里没有写“跨模块依赖怎么处理”，把这条补进去。每做一个模块，Skill 就更完善一点

![](https://static001.geekbang.org/resource/image/25/52/25c903d098b75d45a4f0d42d31231f52.png?wh=3394x878) ![](https://static001.geekbang.org/resource/image/5f/32/5fbaa925f6yy153a599290fbddb4fb32.png?wh=3388x1886) ![](https://static001.geekbang.org/resource/image/13/2d/13c5037ea998f4b37ae6d20322d37e2d.png?wh=3354x1832)

## 总结

三个场景走完，展示了核心功能基础篇的两条核心交付路径：模块从后端到前端的完整闭环、经验从执行到沉淀的 Skill 循环。

几个值得记住的动作：

数据模型讨论不能跳。auth\_config 用 JSON、健康状态独立成表，这些决策在后面每个模块都有依赖，前面省下的时间，后面要还三倍。

报错给完整日志。只给最后一行，Claude Code 在猜；给完整栈和相关配置，它能定位根本原因，通常一轮解决。

curl 通了不算完。浏览器走完整链路，才是真正的交付闭环，每一层都可能有自己的坑。

Skill 写了要真的用。开始新模块前先看一眼.claude/skills/，习惯养成之前可以在 CLAUDE.md 顶部加一行提示。

从下一讲开始进入高阶篇，给智能客服接入产品文档，让它回答时能引用真实内容。

期待你与我分享自己的体验。如果今天的课程让你有所收获，也欢迎转发给有需要的朋友，邀请他来一起学习，我们下节课再见！

公开

同步至部落

取消

完成

0/2000

直线

曲线

AI

2026-04-23给文章提建议

馨冉

Command + Enter 发表

0/2000字符

提交留言

大纲



固定大纲

我的真实体验和看法

屏录演示

场景一：后端跑通——从 Entity 到 Controller

场景二：前端对接——mock 换成真实 API

场景三：把经验变成 Skill

总结