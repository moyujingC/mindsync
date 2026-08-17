# Prompt 越写越像一堵墙，改一处就怕塌一片｜Prompt 模板与注册表

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396415460-0f1c50ac-2716-444e-b5de-e2c473b13785.png" title="null" crop="0,0,1,1" id="KPwNK" class="ne-image">

## 运营只想改一句活动口径 第 05 课后半段，你已经知道全量塞文档会出问题。 但业务不会等你慢慢设计。 周三下午，运营同事急匆匆跑来：

> 降噪耳机活动口径改一下，会员价不能叠券，这句话要更明确。

> 你打开上一版 Prompt。
> 里面有客服身份、事实优先级、活动规则、售后规则、旧活动复盘、客服边界、拒答说明。
> 一整面墙。你想改活动口径，却不得不在一堆文字里搜索“会员券”“叠加”“金卡”“双11”。
> 刚改完，售后主管又提醒：

> 你别把退款边界也改坏了。上次你加活动规则的时候，AI 又开始说“可协助赔偿”。

> 这就是新的事故现场：Prompt 太长以后，不只是模型读不稳，人也改不稳。
> 现在小哲电商的问题不再只是“把规则放进 Prompt”，而是 Prompt 需要像代码一样被组织、选择、排序和关闭。
> 所以第 05 课不是被推翻了。它故意把“全量塞进去”的坏味道暴露出来：能救火，但会混乱。第 06 课开始做的是拆解治理，把那一整面墙拆成可管理的片段。
> 这就引出了第 06 课的升级：Prompt Template 和 Prompt Registry。

## Prompt 不能再是一整段话 上一课的 Prompt 像这样：

```latex
客服身份 + 事实优先级 + 活动规则 + 售后规则 + 旧活动复盘 + 拒答边界 + ...
```

所有东西挤在一起。
这种写法早期很快，但有三个问题：改不动、选不准、排不清。
你不知道一句活动口径会不会影响售后回答；用户明明问活动，Prompt 里仍然塞退款旧规则；新规则和旧规则同时出现时，模型也不一定知道谁优先。
所以这次要换一种管理方式：

```latex
把 Prompt 拆成片段，再按当前问题选择片段。
```

### Prompt Template：固定骨架 Prompt Template 可以先理解成一套固定骨架。 它不直接写死所有规则，只规定每轮 messages 应该长成什么样：

```latex
客服身份 高优先级边界 当前问题需要的业务片段 回答风格 系统确认的 runtime 事实 粗意图 用户原话
```

就像你写客服回复模板，不会把每个活动都写死在模板里，而是预留一个位置：

```latex
这里放当前活动口径
```

第 06 课代码里，对应的是：

```python
render_prompt_template(request, intent_result, fragments)
```

它负责把选中的 Prompt 片段放回固定结构里，再交给模型。骨架稳定后，活动、售后、风格这些可变内容才有地方插拔。

### Prompt Registry：规则抽屉 Template 只有骨架还不够。 你还需要一个地方管理每个规则片段。 这就是 Prompt Registry。 第 06 课快照里有一个文件：

```latex
code/agent-course-versions/lesson-06-prompt-registry/backend/prompt_registry.json
```

里面每个片段都不是一段裸文本，而是带着结构化字段：

```latex
fragment_id title priority enabled applies_to tags content
```

这些字段在小哲电商里都有实际意义：

| 字段 | 作用 |
| --- | --- |
| `fragment_id` | 给片段一个稳定名字，调试和排查都能引用它。

|
| `priority` | 控制规则顺序，高优先级片段排在前面。

|
| `enabled` | 旧活动复盘口径可以留档，但不进入当前 Prompt。

|
| `applies_to` | 片段只在对应意图下加载，例如活动片段只给活动咨询。

|
| `content` | 真正进入 Prompt 的规则文字。

| 你要改活动规则，就改活动片段；要关闭旧活动，就把旧片段 `enabled` 设成 `false`；要让边界永远优先，就给身份和事实优先级更高的 `priority`。 这里的 `priority` 数字不是神秘评分，也不是模型置信度。它只是排序用的工程约定：100、90、80 可以，10、9、8 也可以，关键是相对顺序清楚。数字之间故意留空，是为了以后插入新片段时不用把所有编号重排。

### 本轮只加载需要的片段 Prompt Registry 的重点不是“把一段长 Prompt 切成很多小 Prompt”，而是选择。 用户问活动，就加载活动口径；用户问退款，就加载退款边界；客服身份、事实优先级、回答风格这种通用边界，每轮都加载。 这一步仍然不是 RAG。 它没有去知识库里找相似资料，也没有返回引用来源。它只是按当前粗意图，从已经注册好的 Prompt 片段里选出本轮需要的内容。

## 代码落地：从注册表到 messages

### 当前代码位置 当前代码快照在：

```latex
code/agent-course-versions/lesson-06-prompt-registry/backend/
```

这次不用把所有文件逐个读完，只抓这一条主链路：

```latex
/chat -> classify_intent(user_message) -> load_prompt_registry() -> select_prompt_fragments(intent) -> render_prompt_template(...) -> call_chat_model(messages) -> session_state.prompt_registry
```

这里没有检索，也没有引用来源。
它仍然是 Prompt 方案，只是把 Prompt 从一整面墙拆成了可管理的片段。

### PromptFragment：让规则片段变成对象 注册表里的片段进入代码后，会被校验成 `PromptFragment`：

```python
class PromptFragment(BaseModel): fragment_id: str title: str priority: int enabled: bool = True applies_to: list[str] tags: list[str] = Field(default_factory=list) content: str
```

上一课里，规则只是 Prompt 里的一段文字。
这一课里，规则变成了一个有字段约束的对象。
这一步让 Prompt 管理从“改一大段文字”变成了“维护一组可校验的规则片段”。
加载注册表的代码也很短：

```python
def load_prompt_registry() -> list[PromptFragment]: with PROMPT_REGISTRY_PATH.open(encoding="utf-8") as file: return [PromptFragment.model_validate(item) for item in json.load(file)]
```

如果活动口径要改，你不需要去改 `Lesson06Agent.chat` 主流程。旧活动要关闭，也不用删代码，只要把注册表里的片段设成：

```json
"enabled": false
```

对小哲电商来说，这一步的意义是：业务口径变更尽量发生在注册表里，Agent 主流程保持稳定。

### 选择片段：enabled、applies_to、priority 第 06 课的核心选择逻辑在：

```python
def select_prompt_fragments(intent: Intent, registry: list[PromptFragment]) -> list[PromptFragment]: selected = [ fragment for fragment in registry if fragment.enabled and ("all" in fragment.applies_to or intent in fragment.applies_to) ] return sorted(selected, key=lambda fragment: fragment.priority, reverse=True)
```

它只做两件事。
第一，过滤：

```latex
enabled = true applies_to 包含 all 或当前 intent
```

所以用户问活动时，会加载当前音频活动口径，不会加载已经关闭的旧活动复盘。
第二，排序：

```latex
priority 从高到低
```

这样身份和事实优先级在前，具体活动口径在后，表达风格更靠后。
Prompt 顺序会影响模型注意力。高风险边界和事实优先级必须稳定地站在前面，不能靠“刚好写在前面”这种手感维护。

### 渲染模板：把片段放回 system/user messages 片段选出来以后，还要重新变成模型能接收的 messages。这一步在 `render_prompt_template` 里：

```python
fragment_text = "\n\n".join( f"[{fragment.fragment_id} | priority={fragment.priority}]\n{fragment.content}" for fragment in fragments ) system_message = ( "你是小哲电商公司的客服 Agent。当前版本使用 Prompt Template 和 Prompt Registry 管理规则片段。\n" "请严格按照下列片段顺序回答；高优先级片段覆盖低优先级片段。\n\n" f"{fragment_text}" )
```

片段进入 `system_message` 时，会带上：

```latex
[fragment_id | priority=数字]
```

这不是给用户看的，而是给调试后台和排查过程看的。当你确认 Prompt 里有 `promotion-current-audio-rule`、没有 `legacy-promo-2024-note`，看的就是这一层。
比如运营说“活动口径怎么还是旧的”，你先不用猜模型是不是没理解。打开调试后台，看本轮 system prompt 里有没有 `[promotion-current-audio-rule | priority=80]`：有，说明片段进来了，问题可能在模型理解；没有，说明片段选择或注册表配置就有问题。
`user_message` 里则继续放系统事实、粗意图和用户原话。这一步守住前面课程立下的边界：

```latex
规则片段 -> system_message 系统事实、粗意图、用户原话 -> user_message
```

不要把规则、事实和用户说法混成一团。

### 运行证据：selected_fragment_ids 最后看主流程压缩版：

```python
intent_result = classify_intent(request.user_message) registry = load_prompt_registry() fragments = select_prompt_fragments(intent_result.intent, registry) messages = render_prompt_template(request, intent_result, fragments) answer = call_chat_model(messages)
```

这一版 Agent 的顺序很清楚：先识别粗意图，再读取注册表，根据意图选择片段，按模板渲染成 `system/user` messages，最后调模型生成回答。
主流程后面还会把片段选择结果写进 `session_state`：

```python
"prompt_registry": { "template": "customer_service_v1", "selected_fragment_ids": [fragment.fragment_id for fragment in fragments], "selected_fragment_count": len(fragments), "priorities": [fragment.priority for fragment in fragments], "disabled_fragment_ids": [ fragment.fragment_id for fragment in registry if not fragment.enabled ], }
```

这段状态是本课的排查入口。它回答了一个很具体的问题：

```latex
这轮回答到底用了哪些 Prompt 片段？
```

如果运营说活动口径还是旧的，你可以先看 `selected_fragment_ids`。旧片段没被选中，问题可能在模型理解；旧片段被选中了，问题就是注册表配置。这比在一整段 Prompt 里猜要稳得多。

### 为什么不用一个更大的 system prompt 这一课不是把 Prompt 写得更长，而是把 Prompt 拆成能被管理的工程对象。 如果继续维护一个大 system prompt，短期看起来最省事：所有身份、活动口径、售后边界、拒答规则都放在一段话里。可小哲电商一旦进入真实客服节奏，问题会马上出现：

| 做法 | 现场后果 |
| --- | --- |
| 所有规则写进一段大 Prompt | 运营只改一句活动话术，也可能碰到退款边界。

|
| 靠人工记住哪段规则有效 | 调试后台看不出这一轮到底用了哪条规则。

|
| 用注释或复制粘贴保留旧版本 | 旧活动口径可能继续干扰模型回答。

|
| 每轮都塞全量规则 | 查物流这种低风险问题也要为退款审批规则付 token。

| Prompt Registry 的取舍是：多维护一层 `PromptFragment`，换来可启停、可排序、可追踪。`enabled` 决定片段是否还能被加载，`applies_to` 决定它服务哪类问题，`priority` 决定冲突时谁更靠前，`selected_fragment_ids` 则让调试后台能还原这一轮到底用了哪些规则。 所以它不是 Prompt 技巧展示，而是小哲电商开始把 Prompt 当成配置资产管理。回答翻车时，你不再从一整堵 Prompt 墙里猜问题，而是先看本轮加载了哪些片段、有没有加载过期片段、关键边界是不是根本没进上下文。

## 别把 Prompt 技巧变成另一堵墙

### CoT 的边界 运营改活动口径时，你还会遇到另一类诱惑。 有人会说：

> 那就让 AI 把每一步思考都写出来，不就更稳了吗？

> 这说的是 CoT，也就是 Chain of Thought。
> 在小哲电商客服 Agent 里，它可以先理解成：

```latex
让模型在处理复杂问题时，先按步骤组织判断，再给出答案。
```

它可以帮助模型别跳过关键条件，但不能代替工具查询。订单有没有发货，要查订单工具；活动规则是什么，要看当前规则；高风险退款能不能通过，要走后面的 Workflow 和 HITL。
CoT 只是帮助模型把已知信息组织得更清楚，不负责凭空制造事实，也不应该直接展示给真实客服用户。真实客服回答应该给用户看结论、依据和必要解释，而不是把模型草稿原样摊开。

### Few-shot 的边界 Prompt 工程里还常见一个技巧：few-shot。 它的意思是给模型看少量示例，让模型模仿格式或判断方式。 few-shot 适合固定格式输出、少量边界样例、教学调试里的回答结构示范。 但它不适合被无节制地塞进主 Prompt。 如果你把几十个客服示例、历史事故、旧活动话术都塞进去，few-shot 就会变成另一堵墙：token 变贵，旧例子干扰新规则，示例里的过期口径还可能被模型当成当前事实。 所以第 06 课的主线不是“多塞示例”，而是先把规则拆成可启停、可排序、可排查的 Prompt 片段。 需要稳定格式时，可以少量使用示例；需要长期守住业务边界时，更应该靠 schema、工具事实、RAG 引用、Workflow 和 Evaluation。

## Prompt Registry 也开始露出成本压力 Prompt Registry 解决了维护问题。 但成本和上下文压力还在继续往上冒。 用户每问一次，Agent 仍然要把选中的规则片段送进模型。 规则片段越来越多时，即使比全量注入少，也会持续增加 token。 而且它仍然靠 Prompt 直接承载规则。 如果小哲电商的资料继续变多，下一步问题一定会变成：

```latex
到底每轮花了多少 token？
```

这就是第 07 课要算的账。

## 怎么验证老板能闭嘴 你可以发送：

```latex
降噪耳机会员价还能叠加会员券吗？
```

这一版要看：
1. `intent` 被识别为 `promotion_consult`。
2. `session_state.prompt_registry.selected_fragment_ids` 包含 `promotion-current-audio-rule`。
3. `legacy-promo-2024-note` 出现在 `disabled_fragment_ids`，但没有进入本轮 Prompt。
4. `priorities` 按从高到低排列。
5. 调试后台能看到本轮到底选中了哪些 Prompt 片段。
这次老板能看到：

> 你不是又写了一大段 Prompt，而是把 Prompt 变成了可管理的规则片段。

> ## 本节知识总结 Prompt 工程不是把所有要求越写越长。
> 当一个 AI 应用变复杂后，Prompt 会很快混进角色设定、格式要求、安全边界、业务规则、示例、运行时事实和用户问题。它们如果全部堆在一段文本里，短期能跑，长期很难维护。
> 所以更通用的做法，是把 Prompt 当成可组合的工程资产：

```latex
稳定骨架用模板管理 可变规则用片段管理 每轮按场景选择需要的片段 保留选中、禁用和优先级证据
```

| 知识点 | 小哲项目里的落点 |
| --- | --- |
| Prompt Template | 小哲客服 Agent 用固定骨架放身份、边界、事实、规则和用户输入。

|
| Prompt Registry | 当前活动、通用边界、旧活动复盘被拆成不同 Prompt 片段。

|
| 片段化加载 | 用户问耳机活动时选中当前音频活动片段，不把旧双11复盘塞进去。

|
| 优先级与启用状态 | 当前规则可以启用，历史复盘可以留档但不进入本轮回答。

|
| Prompt 可排查性 | 调试后台能看到 `selected_fragment_ids` 和 `disabled_fragment_ids`。

|
| Prompt 技巧边界 | CoT 和 few-shot 可以辅助，但不能替代事实工具，也不能变成新的 Prompt 墙。

| Prompt Template 解决“结构在哪里”的问题，Prompt Registry 解决“规则片段怎么维护、启停、选择和排查”的问题。它们不是为了把 Prompt 包装得更复杂，而是为了避免一整段提示词越改越脆。

## 小哲心中隐隐的担心 运营这次终于能放心改活动片段了。 售后主管也不用担心活动口径改坏退款边界。 你看着 `selected_fragment_ids`，觉得系统终于有点工程样子。 但月底很快到了。 老板把模型平台账单往你面前一放：

> 你这个 AI 客服，token 费怎么比客服工资还高？

> Prompt 墙拆开了。
> 账单却没有消失。
