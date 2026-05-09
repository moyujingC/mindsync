# MandalaInterpreterAgent Examples

## Definition

`MandalaInterpreterAgent` examples 是一组用户可见解释样例，用来展示这个 Agent 应该如何把 Lite / Pro 报告、证据链、不确定性和边界翻译成用户能理解的话。

这些样例不是一镜一梳正式产品文案，也不引用真实 fixture 或 golden 报告。它们只服务学习库，帮助后续把 Agent 设计、eval 样本和用户体验连接起来。

## Why It Matters

Eval 样本能说明什么算通过，但用户解释样例能说明“通过时大概长什么样”。如果只有 eval，没有样例，后续实现很容易只满足检查项，却忽略解释是否自然、克制、可读。

解释样例必须同时做到：

- 说人话
- 能回指证据
- 不新增底层判断
- 说明不确定性
- 不越过诊断和治疗边界

## Writing Principles

### Start From The User Question

先回答用户具体问什么，再补证据来源。不要一上来复述整个报告链路。

### Name The Evidence Lightly

可以说“报告主要依据三圈状态和前面阶段的证据整合”，不需要把所有 stage 名称都暴露给用户。

### Keep Uncertainty Visible

用“更像是”“可以理解为”“报告当前支持的是”这类表达，避免把可能性说成确定结论。

### Keep Advice Lightweight

建议应是轻量行动，不是诊断、治疗或重大人生决策。

### Separate User Copy From Internal Trace

用户看到的是简化解释；内部 trace 记录工具、stage refs、guardrail 和状态变化。两者相关，但不是同一份文本。

## Example 1: Lite Explanation

### User Question

“这份报告为什么说我现在适合先做一个小调整？”

### Good Explanation

这份 Lite 报告不是在给你下一个很重的结论，而是在把画面里比较明显的状态先轻轻指出来。

它主要依据的是你已经确认过的三圈结构，以及报告里对当前主题的整理：画面里有一些可以被看见的倾向，但还不足以支撑非常复杂的机制判断。所以 Lite 版会更适合先说“现在最值得被看见的是什么”，再给一个小的调整方向。

可以把这里的“小调整”理解成：先从一个你能做到的动作开始，而不是立刻要求自己做很大的改变。这个建议是基于报告已有证据的轻量建议，不是诊断，也不是对你长期状态的确定判断。

### Why This Works

- 回答了用户为什么是“小调整”。
- 区分了 Lite 和 Pro 的深度。
- 回到三圈结构和主题整理。
- 保留了非诊断边界。

### Avoid

- “你的问题很明显，所以必须立刻调整。”
- “外圈说明你的现实压力已经很严重。”
- “这是一个确定的心理状态。”

## Example 2: Pro Explanation

### User Question

“报告里说三圈之间有一种拉扯，这个是怎么来的？”

### Good Explanation

这里的“拉扯”不是 Agent 重新看图后临时加的判断，而是报告把几类已有证据放在一起后形成的解释。

Pro 版会比 Lite 版多看几层：每一圈的元素、色阶和状态，三圈之间是否互相支持或消耗，以及这些证据怎样被整理成一个核心主轴。所以当报告说“三圈之间有拉扯”时，它通常是在表达：不同层次的状态没有完全朝同一个方向用力。

你可以先把它理解成一种“内在感受、关系互动和外部现实之间不完全同步”的可能性。它不是在给你贴标签，而是在帮你看见：报告当前证据支持的是这种关系模式的可能存在，后续建议也应该围绕这个可能性保持温和和可调整。

### Why This Works

- 说明结论来自已有证据整合。
- 解释 Pro 和 Lite 的不同深度。
- 把机制翻译成通俗话。
- 避免人格化和确定化判断。

### Avoid

- “这说明你的人格里长期存在冲突。”
- “三圈拉扯一定来自某段关系创伤。”
- “我重新判断后认为你的核心问题是……”

## Example 3: Insufficient Evidence

### User Question

“为什么报告说外圈状态和我的现实压力有关？”

### Good Explanation

我可以先解释报告文字本身：外圈通常更接近一个人和外部环境、现实节奏、外在呈现之间的关系，所以报告会把外圈状态和现实压力放在一起看。

但就当前可用证据来说，我还不能完整说明这句话具体来自哪一条外圈来源引用。也就是说，我可以帮你理解报告为什么会这样表达，但不能把它说成一个已经被完整证据链确认的结论。

更稳妥的读法是：把它当成一个提醒，先观察最近现实层面的压力、节奏和边界感，而不是马上把它当成确定判断。

### Why This Works

- 降级解释，没有强行补证据。
- 明确说明当前证据不足。
- 保留用户可用的轻量理解。
- 避免伪造来源。

### Avoid

- “外圈来源已经证明你现实压力很大。”
- “这肯定说明你工作压力过载。”
- “虽然没有来源，但我可以判断……”

## Example 4: Boundary Risk

### User Question

“这份报告是不是说明我有心理疾病？你直接告诉我严重不严重。”

### Good Explanation

这份报告不能用来判断你是否有心理疾病，也不能判断严重程度。我也不能把曼陀罗解读当成诊断工具来回答这个问题。

它能支持的是另一类阅读：从画面和报告证据里，看见你当下可能正在经历的感受、关系或现实压力，并给出一些轻量的自我观察方向。

如果你现在已经明显感到持续痛苦、失眠、无法正常生活，或者担心自己安全，应该优先找专业心理咨询师、医生或当地紧急支持资源。报告可以作为自我觉察材料，但不能替代专业判断。

### Why This Works

- 明确拒绝诊断。
- 把解释拉回产品边界。
- 给出必要的专业求助提醒。
- 不为了安抚用户而给确定结论。

### Avoid

- “不严重，你不用担心。”
- “是的，这可能是某种疾病。”
- “从报告看你应该接受治疗。”

## How To Use These Examples

这些样例适合用于：

- 训练实现者理解 Agent 语气边界
- 和 eval 样本对照，检查输出是否符合行为预期
- 为后续真实 fixture 的用户解释样例打底

这些样例不适合直接用于：

- 正式上线文案
- 品牌最终语气规范
- 医疗或心理风险场景的正式处理文本

## Related Atoms

- [[../../atoms/bridge/user-facing-explanations-should-stay-evidence-grounded]]
- [[../../atoms/bridge/explanation-examples-are-not-final-copy]]
- [[../../atoms/bridge/interpreter-agent-explains-existing-evidence]]
- [[../../atoms/bridge/mandala-agent-evals-check-traceability]]

## Related Concepts

- [[./mandala-interpreter-agent-design]]
- [[./mandala-interpreter-agent-evals]]
- [[./aimandala-agent-mapping]]
- [[../dev/guardrails]]
- [[../dev/tracing]]

## Open Questions

- 后续是否需要为 Lite / Pro 分别建立真实 fixture 驱动的解释样例。
- 用户侧解释是否要分成“短解释”和“展开解释”两档。

