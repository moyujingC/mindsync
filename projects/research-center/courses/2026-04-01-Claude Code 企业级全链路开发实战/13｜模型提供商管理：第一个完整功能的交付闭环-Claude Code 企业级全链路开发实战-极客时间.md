<audio title="13｜模型提供商管理：第一个完整功能的交付闭环" src="https://res001.geekbang.org/media/tts_audio/20260416/tts-12684-13-967639/ld/ld.m3u8"></audio>

你好，我是 Robert。

从这一讲开始，正式进入核心功能开发。

前面 12 讲都在“准备”——认知框架、产品定义、架构设计、工程骨架、基础组件、前端 UI。我们已准备得足够扎实，现在该看看回报了。

第一个模块是模型提供商管理，让用户配置 OpenAI、Claude、Gemini、Ollama 这些 LLM 提供商，管理 API Key，查看支持的模型，监控健康状态。为什么从这个开始讲起？因为它是 Hify 整个平台的地基，Agent 要选模型、对话要调模型，所有功能都依赖它。而且复杂度刚好，有 CRUD、有外部调用、有鉴权处理、有健康检查，足够展示一个完整的交付流程，但不至于让你迷失在业务细节里。

这一讲最重要的不是 Provider 模块本身，而是它背后的标准交付流程。后面做 Agent、对话引擎、MCP 接入，每个模块都复用这个流程。

我会分四个部分展开：先想清楚、后端拆解执行、前端对接、完整验收。

## 先和 Claude Code 想清楚

10 讲学了咨询模式，不确定的时候先问再做。做一个新的业务模块，正是用这个模式的好时机。上来就让 Claude Code 写代码是最常见的错误，你连这个模块要考虑哪些东西都没想清楚，它写出来的代码一定有遗漏。

1\. 支持哪些供应商？

比如，你知道业界有多少 LLM 的供应商吗？我敢保证你肯定不知道，或者不知道全。所以你可以问 Claude Code：

Hify 要支持 LLM 模型提供商管理。帮我分析：主流的 LLM 供应商有哪些？它们的 API 有什么共性和差异？哪些是一期必须支持的？

Claude Code 给了一份非常详细的分析。信息量最大的不是供应商列表本身，而是它按三个维度做的分类，这直接影响了我们后面的架构决策。

按接口兼容性分：

![](https://static001.geekbang.org/resource/image/07/cb/077c8ba2b07501f978ee9ddb080921cb.png?wh=1850x418)

这个分类是关键洞察，“OpenAI 兼容”是一个巨大的阵营。DeepSeek、Moonshot、Azure OpenAI 这些，接口格式和 OpenAI 一模一样，只需要改 baseUrl 和 API Key 就能接入，不需要写一行适配代码。

按消息格式分：OpenAI 格式（大多数）、Anthropic 独立 system 字段、Gemini 完全不同格式（contents + parts）。这个差异决定了后面适配层要怎么设计。

基于这个分析，我的判断，一期支持三种类型加一个通用兼容：

![](https://static001.geekbang.org/resource/image/7a/88/7ab378297b885b468045578bafb7cd88.png?wh=1746x512)

四个类型覆盖 90% 的使用场景。Gemini 消息格式差异最大，适配成本高，放二期。“OpenAI 兼容”类型是最聪明的设计，不是每接入一个供应商就写一套适配代码，而是让用户自己配置 baseUrl，立刻能用。

你会发现，这个小节我写得很详细。这是想告诉你：经过这个问题下来，你是不是一下子就了解了业界主流的 LLM 供应商，以及供应商提供的接口的形态和内容。而这就是你在 AI 领域知识的积累。所以“会问”很重要，通过问来学习了解一个你不知道的领域。

最后接口兼容性的分类，后面适配层设计时会直接用到。13 讲先用 if-else 跑通，下一讲用设计模式重构。

2\. 有没有现成的依赖库？

Java 生态里有没有封装了多 LLM 供应商调用的库？Spring AI、LangChain4j 等，分析成熟度和优缺点。

Spring AI 和我们技术栈最匹配，但 API 还在快速迭代，LangChain4j 功能全但概念太重。

我的判断：一期不引入这些框架，基于 10 讲封装的 LlmHttpClient 自己做。大部分供应商兼容 OpenAI 格式，自己封装工作量不大。引入大框架只为用模型调用部分，性价比不高。

这个决策过程本身值得学习，不是有轮子就一定要用，要看轮子和你场景的匹配度。

3\. 数据模型设计

这是最关键的部分，数据怎么存，决定了接口怎么设计，也决定了前端怎么展示。

基于上面的分析，设计 Provider 模块的数据模型。需要考虑：多种供应商鉴权方式的差异怎么统一存储、一个供应商下有多个模型怎么管理、供应商健康状态怎么表示。

Claude Code 给了一版很扎实的设计（太细致了，我就先不贴内容了）。总结就是有几个点，比我预期的更好。逐个说。

鉴权信息怎么存？

用 auth\_config JSON 字段，按 type 存不同结构：

{ "apiKey": "sk-xxx" }

{ "apiKey": "sk-ant-xxx", "anthropicVersion": "2023-06-01" }

{}

未来加新供应商零改表，JSON 让每种 type 按自己的 schema 存。Claude Code 一开始建议单独建 auth 表，我追问“一对一关系建表有什么收益”，它承认没有实际收益。这种细节层面的追问就是架构师的价值。

模型列表怎么管理？

model\_config 表有两个容易混淆的字段：name 是展示名（比如 GPT-4o），model\_id 是调用时实际传给 API 的值（比如 gpt-4o）。Azure 场景下 model\_id 就是 deployment name，和展示名不一样。另外加了 context\_size 字段存上下文窗口大小，后面对话引擎做上下文管理时直接用，不需要再去查。enabled 字段让用户选择启用哪些模型开放给 Agent。

健康状态为什么独立成表？

这是 Claude Code 给的一个我没想到的好设计。健康状态写频繁——定时探测每分钟更新一次，每次 LLM 调用也可能更新状态。如果放在 provider 表里，高频写操作会和业务读竞争锁。分离之后，provider 表写少读多，可以放心加 @Cacheable 缓存；provider\_health 表不缓存，直接读库。

而且 provider\_health 表的字段比简单的 status 丰富得多：fail\_count（连续失败次数，配合熔断器）、latency\_ms（最近延迟）、last\_success\_at（最后成功时间）、error\_message（最近失败原因）。这些信息在管理控制台展示时非常有用。

最终表结构：

CREATE TABLE provider (

id BIGINT AUTO\_INCREMENT PRIMARY KEY,

name VARCHAR(100) NOT NULL