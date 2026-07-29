<audio title="15｜Agent 创建与配置：复杂业务逻辑的拆解策略" src="https://res001.geekbang.org/media/tts_audio/20260418/tts-12816-13-968094/ld/ld.m3u8"></audio>

你好，我是 Robert。

这一讲做 Agent 模块。

我先假设一件事情：在做 Hify 之前，假设我对 Agent 这个概念的理解非常模糊。知道这个词很火，知道大概是“能用工具的 AI”，但要我说清楚 Agent 在一个 AI 平台里到底是什么、数据怎么存、和模型是什么关系，说不上来。这可能就是你的直观感觉。

这恰好是一个很好的教学场景。你在工作中接到的大部分需求，一开始也是不懂的。以前不懂就去搜、去问同事、去翻文档，花很多时间。现在你有 Claude Code，加上这门课教的方法论——从领域理解到数据建模到拆解执行——不懂的东西可以快速搞懂并落地实现。

这一讲的核心不是 Agent 模块本身，而是这个“现学现卖”的过程。

## 我不知道 Agent 是什么，Claude Code 教我

14 讲刚学了领域快速理解四问。直接用。

在 AI 应用平台（比如 Dify）里，Agent 是什么概念？它和普通的对话有什么区别？用户创建一个 Agent 需要配置哪些东西？从产品层面帮我梳理。

Claude Code 的输出是：

![](https://static001.geekbang.org/resource/image/81/52/81c6d333fa98321f0b1d500cc6d5bf52.png?wh=2168x1538)

你看其实非常清晰了。这个回答帮我建立了清晰的认知：

普通对话是一次性问答——用户发消息、LLM 返回文本、结束。没有记忆，没有工具，没有目标感。

Agent 是有目标、能行动的对话主体。它不只是回答问题，而是根据目标调用工具、根据结果决定下一步。核心差异在于有没有 Tool Use + 多轮自主决策。

![](https://static001.geekbang.org/resource/image/e3/78/e379b0733f9c65b431f575yyfb7a4478.png?wh=1974x652)

创建 Agent 要配三层东西：

![](https://static001.geekbang.org/resource/image/23/0e/232ca9ba99bf2f9403489dfab66f370e.png?wh=1440x762)

第一层：身份定义。名称、描述、System Prompt（角色指令，定义性格、职责、回答风格、边界约束——这是 Agent 的“灵魂”）。

第二层：能力绑定。绑定模型（选哪个 Provider 的哪个 model\_config）、绑定工具（选哪些 MCP Server）、绑定知识库（选哪些 Knowledge Base，后面做 RAG 时再讲）。

第三层：运行参数。temperature（创意度，0= 严谨，1= 发散）、最大输出 token、最大上下文轮数（保留最近几轮对话，影响记忆深度和 token 成本）。

Claude Code 还给了一个关键判断——Hify 的 Agent 边界：

![](https://static001.geekbang.org/resource/image/f5/94/f5b128bc7d56ffc7f52e812c8b7b2694.png?wh=1922x624)

做：Agent 绑模型、绑 MCP 工具、配 System Prompt，Agent 发起对话。

不做：不做 Agent 自主多步推理（ReAct / Function Calling 循环，那是 Workflow 的事）、不做 Agent 之间互相调用、不做 Agent 记忆持久化（上下文靠 Redis session）。

也就是说 Hify 的 Agent 更接近有身份的对话配置模板，而不是完整的 Autonomous Agent。这个定位对 20-50 人内部使用是合适的，够用，不过度复杂。

到这里你会发现，Claude Code 不止是一个写代码的程序员，还是一个专家，一个导师。

## 从概念映射到数据结构

理解了 Agent 是什么，下一步自然是：这些信息怎么存？而我们刚刚了解了 Agent 是什么。在以往的流程中，我们需要再深度花时间去理解，才有可能把 Agent 映射为程序的语义，比如 Agent 在存储中怎么表示的。

一般情况下，当一个概念，被我们映射为存储的结构表示，那就说明，我们已经理解它了。接下来我们让 Claude Code 帮我们加速这个事情。

这次的提示词是：

基于刚才的分析，Agent 在数据库里应该怎么存？需要哪些表？表之间什么关系？特别是：System Prompt 用什么类型、模型参数怎么存、Agent 和工具的多对多关系怎么处理。

内容太多，就不贴出来了。总结下，Claude Code 给了数据模型设计，还主动对比了参数存储的三种方案。注意，AI 很擅长对比，这里就考验我们选型决策的能力了，这点你只能慢慢养成。

3 张表就够：agent 主表、agent\_tool 关联表。chat\_session 已有 agent\_id 外键不需要新表。知识库关联先不做，等 RAG 模块开发时再加 agent\_knowledge 关联表。

模型参数怎么存？ Claude Code 对比了三种方案：

方案 A（字段打散存）：temperature、max\_tokens、max\_context\_turns 各一列。查询直接、类型约束清晰，加参数要 ALTER TABLE。

方案 B（JSON 列存）：灵活，加参数不改表，但无法 SQL 直接过滤，多一层解析。

方案 C（混合）：固定参数打散，扩展参数放 JSON。

我的判断：选方案 A。Hify 当前参数就三个，不过度设计。和 13 讲 auth\_config 用 JSON 的决策不同——auth\_config 的字段按供应商类型完全不同，JSON 是必须的；Agent 参数对所有 Agent 都一样，打散存更简单。同样的技术手段不是到处套用，要看具体场景。

agent\_tool 绑 Server 还是绑 Tool？Claude Code 提了一个我没想到的问题：关联的是整个 MCP Server，还是 Server 下的某个具体工具？绑 Server 意味着 Agent 自动获得该服务的所有工具（新工具自动生效），绑 Tool 是精细管控（更繁琐）。

我的判断：绑 Server。20-50 人内部使用，不需要精细管控到单个工具。简单优先。

最终表结构：

CREATE TABLE agent (

id BIGINT NOT NULL AUTO\_INCREMENT PRIMARY KEY,

name VARCHAR(100) NOT NULL UNIQUE,

description VARCHAR(500) NOT NULL DEFAULT '',

system\_prompt TEXT COMMENT '角色指令，可以很长',

model\_config\_id BIGINT NOT NULL