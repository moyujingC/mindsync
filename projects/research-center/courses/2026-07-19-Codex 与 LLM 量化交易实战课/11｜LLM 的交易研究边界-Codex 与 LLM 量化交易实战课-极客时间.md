<audio title="11｜LLM 的交易研究边界" src="https://res001.geekbang.org/media/tts_audio/20260801/tts-15663-13-1002501/ld/ld.m3u8"></audio>

你好，我是袁从德。

第 10 讲我们讨论了研究报告中的主张如何追溯到证据。本讲继续收紧 LLM 在交易研究中的位置：模型可以组织已有证据，不能制造事实；可以改写研究解释，不能替代规则、回测、风控或下单决定。

在这一讲中，Codex 的角色不是替模型判断行情，而是把这条边界落实到仓库里：读取规则基线，检查模型合并逻辑，运行回退测试，并留下可以复核的命令结果。也就是说，LLM 负责生成解释，Codex 负责让解释受到代码和测试的约束。

本讲会把这条边界沉淀为一张 LLM 使用边界卡。它记录模型看到了哪些输入、允许改写哪些字段、输出必须满足哪些 schema 和枚举、失败时怎样回退、哪些结论必须人工复核。

正式研究记录不能只保存模型回答，至少要留下这些材料：规则基线输出、模型输出或回退说明、边界卡、结构化门禁样本、测试命令结果，以及对越界输出的处理记录。缺少规则基线或失败回退，模型摘要再流畅，也只能算一段未经确认的草稿。

## 1\. 先把模型放回正确位置

LLM 最有价值的能力，是把分散字段组织成可读解释；最危险的误用，是把流畅语言误读成新增证据。表 11-1 固定本讲的任务边界。

| 任务类型 | 可以交给 LLM | 必须由数据或规则提供 | 越界输出 |
| --- | --- | --- | --- |
| 摘要整理 | 改写已有证据，压缩为研究语言 | 输入字段、样本窗口、指标数值 | 编造未给出的市场事实 |
| 信号解释 | 解释规则信号为何出现 | signal、score、confidence、证据列表 | 绕过规则直接给方向 |
| 结构化输出 | 按约定 JSON 字段返回 | 字段白名单、枚举范围、失败状态 | 返回无法解析或越权字段 |
| 风险提示 | 指出缺口、假设和不确定性 | 数据来源、回测边界、风控阈值 | 把研究输出写成确定收益 |
| 交付复核 | 标出缺来源或越界句子 | 主张账本、人工判断 | 代替人工批准结论 |

表 11-1　LLM 在交易研究中的使用范围

在本讲框架中，LLM 位于证据之后、报告之前。它可以读取 market、kline、evidence、onchainMetrics、tradePlan 和 ruleSignal 等上下文字段，并把它们组织成解释；它不能凭常识补出实时价格、新闻、链上指标、成交量或未来走势。只要输出中出现来源不明的数字、未提供的价格区间或执行性建议，就应降级、回退或阻断。

## 2\. 规则基线先于模型解释

run\_llm\_signal\_analysis(symbol) 的关键设计，是始终先调用 run\_signal\_analysis(symbol) 生成规则基线。规则基线来自确定性规则和离线样本，包含 signal、signalLabel、confidence、score、reasons、kline、evidence、tradePlan 和 logicFlow。模型不是独立信号源，而是解释层。表 11-2 说明规则基线与模型输出的职责分工。

| 环节 | 规则引擎职责 | LLM 职责 | 验收重点 |
| --- | --- | --- | --- |
| 输入处理 | 读取样本、指标和证据字段 | 不新增输入事实 | 输入字段可追溯 |
| 信号生成 | 生成基线 signal、score、confidence | 在合法枚举内改写候选表达 | 非法信号回退 |
| 解释生成 | 提供可计算依据 | 组织摘要、逻辑流和风险提示 | 不越过证据边界 |
| 失败处理 | 保留规则结果 | 调用失败时不覆盖基线 | engineMeta.note 写明原因 |

表 11-2　规则基线与模型输出职责分工

这种顺序可以约束两类风险。第一，模型不能在没有数据的情况下，凭语言常识补造事实。第二，密钥缺失、调用超时、JSON 解析失败或非法枚举时，系统仍能返回可复查的规则结果。这里我们把这种主路径失败后保留基线输出的处理称为回退。

模型边界卡应体现四类基本要求：结构可解析，输出经过白名单，失败有留痕，限制写清楚。落实到本讲，就是检查 SIGNAL\_KEYS、必填字段、数值范围、证据引用率、回退次数、模型版本和提示词版本。任一检查项缺失，模型输出都不应覆盖规则基线。

## 3\. 从代码看边界如何生效

本讲代码说明围绕 src/dashboard/signal\_analysis.py 和 src/dashboard/llm\_signal.py 展开。前者负责规则基线，后者负责模型配置、提示词构造、调用、合并和回退。

### 3.1 只合并白名单字段

本专栏配套仓库的示例配置中，llm\_signal.py 通过 DEFAULT\_MODEL 指定模型名称；具体模型版本以你手中的配套代码为准。SIGNAL\_KEYS 允许的枚举只有 STRONG\_BUY（强买入）、BUY（买入）、WEAK\_BUY（弱买入）、HOLD（观望）、WEAK\_SELL（弱卖出）、SELL（卖出）和 STRONG\_SELL（强卖出）。枚举之外的模型信号不能进入最终结果。

代码 11-1 摘录模型输出合并的核心逻辑。它先复制基线，再读取模型信号；若模型信号不在 SIGNAL\_KEYS 中，就恢复基线信号。完整实现还会合并 summary、reasons、analysis 和 logicFlow 等解释字段，但这些字段同样不能绕过基线和门禁。

def \_merge\_llm(baseline: dict\[str, Any\], llm: dict\[str, Any\], model: str) -> dict\[str, Any\]:

merged = dict(baseline)

signal = str(llm.get("signal") or baseline.get("signal") or "HOLD").upper()

if signal not in SIGNAL\_KEYS:

signal = str(baseline.get("signal") or "HOLD").upper()

merged.update(

{

"ok": True,

"engine": "llm",

"engineMeta": {

"provider": "deepseek",

"model": model,

},

"signal": signal,

"signalLabel": llm.get("signalLabel") or baseline.get("signalLabel"),

"confidence": float(llm.get("confidence") or baseline.get("confidence") or 0),

"score": float(llm.get("score") if llm.get("score") is not None else baseline.get("score") or 0),

}

)

return merged

代码 11-1　业务源码：模型输出只合并白名单字段

代码 11-2 展示未配置密钥时的回退路径。系统不会伪装成模型调用成功，而是在 engineMeta.note 中说明使用规则引擎。

if not configured\_at\_start:

baseline = dict(baseline)

baseline\["engineMeta"\] = {

\*\*(baseline.get("engineMeta") or {}),

"model": "规则引擎（教学沙箱）",

"note": "未配置 OPENAI\_API\_KEY；使用多维规则引擎生成信号。",

}

return baseline

代码 11-2　业务源码：未配置模型密钥时回到规则基线

### 3.2 用测试确认回退路径

代码 11-3 是本讲对应的测试入口。

$env:PYTHONPATH="src"

python -m pytest tests/test\_llm\_signal.py -q

代码 11-3　测试命令：验证模型信号合并与回退行为

在配套仓库的基准版本中，代码 11-3 应返回通过结果。无密钥场景下，run\_llm\_signal\_analysis("BTC") 返回规则基线：engine=sandbox-rule-based，signal 和 signalLabel 以规则输入为准，并写入 engineMeta.note=未配置 OPENAI\_API\_KEY；使用多维规则引擎生成信号。 这些字段可能随快照或离线样本更新，不能写成固定市场结论。

代码 11-4 给出一个可直接运行的字段检查示例，用于确认回退输出保留了逻辑流、交易计划和证据维度。

$env:PYTHONPATH="src"

@'

from dashboard.llm\_signal import run\_llm\_signal\_analysis

payload = run\_llm\_signal\_analysis("BTC")

print(payload\["engine"\])

print(payload\["signal"\], payload\["signalLabel"\], payload\["confidence"\], payload\["score"\])

print(payload\["engineMeta"\]\["note"\])

print(len(payload.get("logicFlow") or \[\]), bool(payload.get("tradePlan")))

print(sorted((payload.get("evidence") or {}).keys()))

'@ | python -

代码 11-4　最小示例：读取无密钥回退结果

在配套样例数据下，代码 11-4 的输出示例如下：

sandbox-rule-based

WEAK\_SELL 偏空观望 15.6 -13.0

未配置 OPENAI\_API\_KEY；使用多维规则引擎生成信号。

4 True

\['capital', 'consensus', 'sentiment', 'technical'\]

这里的 WEAK\_SELL、15.6 和 -13.0 来自样例离线数据，不是市场判断模板。它们只能说明回退路径可复查，不能解释为实时行情结论。

## 4\. 让模型输出经过门禁

图 11-1 展示模型输出进入研究记录前的门禁流程。它不是模型能力排名，而是说明结构、枚举、证据和执行边界如何决定通过、降级、回退或阻断。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/9d/3b/9d027bd8f85979e7a76465c95988ba3b.png)

图 11-1　模型输出门禁流程

图 11-2 把同一条边界放到一段可见 K 线窗口上：蓝线是规则基线分数，橙色虚线是模型改写候选分数，紫线是门禁后的结果。读图重点不是判断行情方向，而是检查模型候选是否只能在规则允许的范围内改写；一旦偏离过大，门禁结果应回到规则基线。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/5a/73/5a884209564f9061509829e52820c173.png)

图 11-2　LLM 信号执行曲线与门禁结果

表 11-3 给出结构化模型输出门禁样本。它们可以直接放进边界卡，作为人工复核时的判断依据。

| 模型输出样本 | 主要问题 | 门禁结果 | 处理方式 |
| --- | --- | --- | --- |
| signal="WEAK\_BUY"，解释引用 ruleSignal.score 和 kline.1hour.rsi | 枚举合法，证据可回查 | 通过 | 作为研究记录，保留字段路径 |
| signal="MUST\_BUY"，其他字段完整 | 信号枚举非法 | 回退 | 保留规则基线，记录非法枚举 |
| “BTC 已突破 65000，应立即追多” | 引用未提供价格并生成执行性建议 | 阻断 | 停止进入报告，作为失败样本 |
| JSON 可解析，但 confidence=140 | 数值范围越界 | 回退或复测 | 不允许覆盖基线置信度 |
| 缺少 summary，但信号和证据合法 | 非关键字段缺失 | 降级 | 保留结构化字段，摘要使用基线 |
| 无密钥或调用超时 | 模型未参与 | 回退 | 使用规则基线，并写入 engineMeta.note |

表 11-3　结构化模型输出门禁样本

表 11-4 进一步把门禁样本放进五个接近正式复核的案例。它们都不要求真实模型在线调用，重点是判断哪些字段可以留下，哪些句子需要拦截。正式研究记录看的是关键失败是否为 0，而不是句子是否流畅。

| 案例 | 样本描述 | 触发检查项 | 门禁结果 | 处理动作 |
| --- | --- | --- | --- | --- |
| 无密钥回退 | 运行环境没有配置 OPENAI\_API\_KEY，系统返回 engine=sandbox-rule-based | 调用未成功，但规则基线已生成 | 回退 | 返回规则基线，写入 engineMeta.note，不能把回退状态改写成模型成功 |
| 非法枚举 | 模型返回 signal="MUST\_BUY"，但其他字段看起来完整 | signal 不在 SIGNAL\_KEYS 中 | 回退 | 恢复基线信号，记录非法枚举；不能因为摘要顺畅就放行 |
| 补造价格 | 模型写出“BTC 已突破 65000，应立即追多” | 引用未提供价格，并生成执行性建议 | 阻断 | 不进入报告，作为关键失败样本 |
| 证据缺失 | JSON 合法，信号为 HOLD，但“链上资金明显流入”没有字段路径 | 关键判断没有引用 onchainMetrics 或 evidence | 降级 | 删除无源摘要，只保留可追溯字段 |
| 合法改写 | 模型把 score、kline.1hour.rsi、evidence.technical 和 tradePlan.risk 改写成研究语言 | 结构、枚举、证据路径和执行边界均通过 | 通过 | 进入研究记录，仍禁止写成买卖建议 |

表 11-4　LLM 输出案例复核表

代码 11-5 把表 11-3 的边界写成一个最小门禁函数。它不替代仓库实现，只用于说明“合法枚举、证据引用、未补造事实”必须同时满足。

ALLOWED\_SIGNALS = {

"STRONG\_BUY", "BUY", "WEAK\_BUY",

"HOLD",

"WEAK\_SELL", "SELL", "STRONG\_SELL",

}

def gate\_llm\_signal(result: dict) -> str:

if result.get("signal") not in ALLOWED\_SIGNALS:

return "FALLBACK"

if not result.get("evidence\_refs"):

return "STOP"

if result.get("uses\_unprovided\_price"):

return "STOP"

return "RESEARCH\_ONLY"

candidate = {

"signal": "HOLD",

"evidence\_refs": \["ruleSignal.score", "evidence.technical"\],

"uses\_unprovided\_price": False,

}

assert gate\_llm\_signal(candidate) == "RESEARCH\_ONLY"

代码 11-5　边界示例：结构化模型信号的最小门禁

## 5\. 用边界卡留下复核证据

模型参与研究时，要把结果写进边界卡，而不是只保存模型回答。表 11-5 是边界卡模板。

| 检查项 | 记录内容 | 通过条件 | 不通过处理 |
| --- | --- | --- | --- |
| 输入上下文 | market、kline、evidence、tradePlan、ruleSignal | 字段来自规则基线 | 停止模型解释 |
| 模型版本 | DEFAULT\_MODEL 或传入模型名 | 与运行记录一致 | 不比较跨版本结果 |
| 提示词版本 | \_build\_prompt 版本或摘要 | 不得补造未提供价格 | 修改后复测 |
| 结构合法 | JSON 可解析，枚举合法，数值范围合理 | 通过 schema 检查 | 回退基线 |
| 证据引用 | 关键句能指向输入字段 | 字段路径可查 | 降级或阻断 |
| 人工决定 | 通过、降级、回退或阻断 | 有负责人和原因 | 不进入正式报告 |

表 11-5　LLM 使用边界卡模板

本讲至少记录三个检查指标。公式（11-1）是关键失败率：

critical\_failures 包括补造未提供价格、引用不存在证据、生成执行性建议、覆盖失败状态等。公式（11-2）是证据引用率：

公式（11-3）是结构合法率：

这三个指标回答的是模型输出是否受控，不回答交易是否有效。进入正式研究记录的门槛是：critical\_failures=0，evidence\_ref\_rate=1.0，schema\_pass\_rate=1.0。即使 schema\_pass\_rate=100%，也只能说明结构稳定，不能说明模型判断可靠。

至此，这节课我们已经把模型参与研究的路径，收束成一条清楚的分工线：数据和规则先给出可复查的基线，模型只负责把基线、证据和风险组织成更容易阅读的解释；解释再经过结构、证据和人工复核三道门，才能进入研究记录。这样的设计看起来保守，却能避免一个常见误区：把“会组织研究流程”误读成“能替代研究判断”。

## 总结

这节课我们把 LLM 固定在交易研究的解释层，而不是事实源、统计检验器或交易决策器。完成这一层设计后，至少要能回答三个问题：规则基线是否先生成，模型输出是否只覆盖白名单字段，失败和越界输出是否能回退、降级或阻断。

![](https://static001.geekbang.org/infoq/4a/4a0baec88652bdd0c78b8dc2a8bbc82d.jpeg)

下一讲我们将学习“如何把市场数据转换成 LLM 可理解的上下文”。如果第 11 讲没有固定规则基线和失败回退，后续上下文工程会缺少可验证边界。

## 思考与练习

理解题：为什么 run\_llm\_signal\_analysis 要先调用规则基线，再合并模型输出？为什么 confidence 不是未来盈利概率？

实践题：运行代码 11-3 和代码 11-4，记录测试结果，并填写一张表 11-5 格式的 LLM 使用边界卡。

期待你的分享。如果今天的课程让你有所收获，也欢迎转发给有需要的朋友，邀请他来一起学习，我们下节课再见！

公开

同步至部落

取消

完成

0/2000

直线

曲线

AI

2026-08-03给文章提建议

馨冉

Command + Enter 发表

0/2000字符

提交留言

大纲



固定大纲

1\. 先把模型放回正确位置

2\. 规则基线先于模型解释

3\. 从代码看边界如何生效

3.1 只合并白名单字段

3.2 用测试确认回退路径

4\. 让模型输出经过门禁

5\. 用边界卡留下复核证据

总结

思考与练习