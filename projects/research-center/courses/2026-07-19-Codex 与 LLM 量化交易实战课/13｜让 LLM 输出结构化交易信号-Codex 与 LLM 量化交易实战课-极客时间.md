Codex 与 LLM 量化交易实战课

袁从德

AI 创业公司 CTO，某交易所的前算法负责人

1905 人已学习

查看详情

课程目录

已更新 26 讲/共 38 讲

开篇词 (3讲)



时长 17:50

时长 34:14

时长 11:46

第一章：从想法到可验证研究 (5讲)



时长 17:10

时长 16:03

时长 12:39

时长 22:07

时长 24:47

第二章：构建可信数据底座 (5讲)



时长 21:31

时长 21:32

时长 20:24

时长 13:55

时长 21:18

第三章：让 LLM 进入交易研究，但不越界 (5讲)



时长 09:10

时长 14:35

时长 12:57

时长 18:16

时长 14:39

第四章：从信号到策略与回测 (7讲)



时长 21:51

时长 14:18

时长 15:14

时长 15:51

时长 20:22

时长 13:56

时长 17:29

第五章：把研究系统做成可用应用 (1讲)



时长 23:16

袁从德



00:00

1.0x **

讲述：张浩AI版大小：14.82M时长：12:57

<audio title="13｜让 LLM 输出结构化交易信号" src="https://res001.geekbang.org/media/tts_audio/20260805/tts-15732-13-1003734/ld/ld.m3u8"></audio>

你好，我是袁从德。

第 12 讲我们完成了模型标准化输入搭建，这节课我们将聚焦模型输出层工程约束。市场上下文准备完成后，不能直接将“偏多”“谨慎观望”“可逢低关注” 这类自然语言定性结论作为标准化研究信号，所有模型判断必须收敛至固定枚举标签、有界数值分数、可溯源证据、任务状态、失败兜底逻辑、人工复核门禁六套可校验规则。

本讲 Codex 的核心职责，并非美化模型自然语言结论，而是把“LLM 合规输出标准”固化为可自动化校验的业务契约：读取信号生成逻辑、校验字段枚举与数据 Schema、执行结构化输出边界测试，并将非法字段、运行失败、人工复核标记完整落盘归档。LLM 仅负责产出候选信号，Codex 提供程序可强制执行的约束校验，证明候选信号具备标准化消费能力。

本讲的最终交付物为一套完整结构化信号契约，实现三大能力：程序全自动解析，研究员人工复核阻断，规则基线 / 风控流程 / 审稿流程多级拦截。一份合规入库信号契约必须同时覆盖：合法枚举集合、数值上下界、证据溯源链路、任务生命周期状态、异常回退策略、Web3 专属阻断规则、人工复核结论，任意一项缺失仅能标记为模型草稿，禁止写入正式研究库。

## 1\. 先构建规则基线，再定义标准化契约

不要从零设计一套理想化信号格式。本讲复用仓库已有业务文件 src/dashboard/signal\_analysis.py：该模块读取离线测试样本，聚合 K 线行情、市场情绪、资金持仓、交易执行计划四大维度数据，输出一套可被 LLM 接管、异常时自动回退的标准化基线信号。

规则基线承担两层核心作用：

不依赖大模型密钥、完全可复现，提供无模型干扰的客观基准。

为 LLM 输出划定最低合规边界：模型可在证据充足时补充推理说明，但不得篡改基线预设字段、枚举值域、风控约束。

关键边界说明：基线输出仅为离线样本驱动的计算结果，不代表我们对实时行情的主观判断，更不构成价格涨跌预测。

代码 13-1 运行当前 BTC 离线样本的规则基线。先把真实输出拿到手，再讨论字段契约。

$env:PYTHONPATH="src"

$env:DASHBOARD\_DATA\_MODE="offline"

$env:DASHBOARD\_OFFLINE\_SOURCE="fixture"

@'

from dashboard.signal\_analysis import run\_signal\_analysis

payload = run\_signal\_analysis("BTC")

print(payload\["engine"\])

print(payload\["signal"\], payload\["signalLabel"\])

print(payload\["confidence"\], payload\["score"\])

print(payload\["summary"\])

print(payload\["tradePlan"\]\["stopLoss"\])

print(len(payload\["logicFlow"\]))

'@ | python -

代码 13-1　 离线 BTC 样本生成规则基线信号（可直接运行）

执行离线教学样本后，实测输出示例：

sandbox-rule-based

WEAK\_SELL 偏空观望

12.6 -10.5

偏空观望 · 置信度 12.6% · 得分 -10 多维证据尚未形成一致方向，保持观望。

58337.0

4

相较于模糊的自然语言判断，结构化输出一次性明确 6 项工程关键信息：计算来源、标准化信号标签、置信强度、方向量化分、止损失效阈值、完整推理链路；同时严格区分“研究观测信号”与“实盘交易指令”。

图 13-1 将代码输出拆解为五大标准化链路：行情快照采集、多维证据聚合、字段门禁校验、标准化研究输出、人工复核归档。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/f5/ac/f51c7e5ebb7aa858fa4ebf80ff7cacac.png)

图 13-1　BTC 结构化信号实战路径

⚠️ 重点提醒：本条输出 WEAK\_SELL 仅由当前离线 Fixture 样本计算得出，不代表中长期行情判断。更换数据源、样本切片、模型权重后，信号会同步变动；只要执行命令、输入样本、字段契约保持可复现，专栏无需固化单一静态市场结论。

大模型擅长生成流畅文字解释，但量化研究禁止将自然语言直接作为信号。例如“短线偏多，等待突破确认”，人可主观解读，程序无法映射至 BUY/WEAK\_BUY/HOLD 任一合法枚举。字段契约的核心价值，就是将模糊自然语言转化为机器可校验、可统计的标准化字段。

表 13-1 是本讲使用的最小字段契约。它不追求覆盖所有交易研究场景，而是先保证输出能被解析、复核和拒绝。

| 字段 | 作用 | 合法范围 | 失败处理 |
| --- | --- | --- | --- |
| signal | 方向标签 | STRONG\_BUY 到 STRONG\_SELL 的枚举 | 非法时回退规则基线 |
| signalLabel | 中文显示标签 | 与 signal 语义一致 | 缺失时使用基线 |
| confidence | 输出强度 | 0 到 100 | 越界时降级复核 |
| score | 方向强弱 | \-100 到 100 | 越界时人工复核 |
| summary | 简短解释 | 只引用已有证据 | 补造事实则停止 |
| logicFlow | 推理路径 | 固定步骤数组 | 不完整时不进入结论 |

表 13-1　结构化交易研究信号的最小字段契约

标准合法信号 JSON 模板：

{

"engine": "llm",

"signal": "WEAK\_SELL",

"signalLabel": "偏空观望",

"confidence": 12.6,

"score": -10.5,

"summary": "多维资金、K线、情绪指标未形成多头共识，维持观望",

"logicFlow": \[

"1. 1h级别均线拐头向下",

"2. 永续资金费率无多头支撑",

"3. 市场恐慌情绪小幅抬升"

\],

"tradePlan": {

"stopLoss": 58337.0

},

"reviewFlags": \[\]

}

非法输出对照样例（系统自动拦截）：

{

"signal": "BUY\_NOW",

"confidence": 130,

"summary": "未来3小时币价将大幅上涨"

}

处理逻辑：非法枚举回退基线、置信度超限标记复核、摘要包含未来信息直接阻断入库。

关键界定：结构化信号仅作为研究观测载体，必须经过复核、实验设计后，才可进入回测或人工审稿流程，严禁对接实盘下单。confidence=80 不代表上涨概率 80%，该数值仅在独立样本外校准后才可用于概率换算。

confidence 与 score 职责严格拆分：

confidence：模型对当前推理结论的确信强度，非涨跌概率。

score：多空方向量化编码，非预期收益预测。拆分两个字段，从根源规避“置信度高 = 预期收益高”的常见误读。

summary 字段强制绑定输入证据：摘要提及“资金大幅流入”，必须可追溯至快照时间、资金指标字段、数据源；若新增原始输入不存在的事实，判定为模型幻觉，直接阻断结论生成。

## 2\. 搭建 JSON 多层校验门禁，约束模型输出

文件 src/dashboard/llm\_signal.py 中常量 SIGNAL\_KEYS 固化 7 类唯一合法信号枚举：STRONG\_BUY、BUY、WEAK\_BUY、HOLD、WEAK\_SELL、SELL、STRONG\_SELL。相比无约束自由文本，固定枚举可实现批量统计、批量回测、自动化复核，完全适配量化工程体系。

### 2.1 清洗模型文本，安全提取 JSON 对象

代码 13-2 展示 \_extract\_json。它处理模型常见输出：有时模型会把 JSON 包在 Markdown 代码块里，这里先清理外层代码块，再用 json.loads 解析。

import re

import json

from typing import Any, Dict

def \_extract\_json(text: str) -> Dict\[str, Any\]:

try:

cleaned = text.strip()

if cleaned.startswith("\`\`\`"):

cleaned = re.sub(r"^\`\`\`(?:json)?\\s\*", "", cleaned)

cleaned = re.sub(r"\\s\*\`\`\`$", "", cleaned)

payload = json.loads(cleaned)

return payload if isinstance(payload, dict) else {}

except json.JSONDecodeError:

return {}

代码 13-2　通用 JSON 提取工具（含异常捕获）

JSON 解析成功仅代表输出可读，不代表信号合规。我们需明确区分“可解析 JSON”与“合格入库信号”两个概念，避免概念混淆。

### 2.2 非法枚举、超限数值强制回退基线，留存复核标记

核心原则：不自动美化模型错误，所有异常完整留痕，便于后续模型缺陷统计。代码 13-3 展示 \_merge\_llm 的门禁逻辑。如果模型给出非法 signal，代码回到规则基线信号；如果 confidence 或 score 越界，代码保留基线数值，并写入 reviewFlags，提醒人工复核。

from typing import Any, List, Dict

def \_bounded\_number(

val: Any,

default: float,

low: float,

high: float,

flag: str,

review\_flags: List\[str\]

) -> float:

"""数值边界约束，超限写入复核标记并返回默认基线值"""

if val is None:

return default

try:

num = float(val)

if low <= num <= high:

return num

review\_flags.append(flag)

return default

except (ValueError, TypeError):

review\_flags.append(flag)

return default

def \_merge\_llm(baseline: Dict\[str, Any\], llm: Dict\[str, Any\], model: str) -> Dict\[str, Any\]:

merged = dict(baseline)

review\_flags: List\[str\] = \[\]

SIGNAL\_KEYS = {"STRONG\_BUY", "BUY", "WEAK\_BUY", "HOLD", "WEAK\_SELL", "SELL", "STRONG\_SELL"}

signal = str(llm.get("signal") or baseline.get("signal") or "HOLD").upper()

if signal not in SIGNAL\_KEYS:

signal = str(baseline.get("signal") or "HOLD").upper()

review\_flags.append("INVALID\_SIGNAL\_FALLBACK")

confidence = \_bounded\_number(

llm.get("confidence"),

default=baseline.get("confidence") or 0,

low=0, high=100,

flag="CONFIDENCE\_OUT\_OF\_RANGE",

review\_flags=review\_flags,

)

score = \_bounded\_number(

llm.get("score") if llm.get("score") is not None else baseline.get("score"),

default=baseline.get("score") or 0,

low=-100, high=100,

flag="SCORE\_OUT\_OF\_RANGE",

review\_flags=review\_flags,

)

merged.update({

"ok": True,

"engine": "llm",

"signal": signal,

"signalLabel": llm.get("signalLabel") or baseline.get("signalLabel"),

"confidence": confidence,

"score": score,

"summary": llm.get("summary") or baseline.get("summary"),

})

if review\_flags:

merged\["reviewFlags"\] = \[\*(baseline.get("reviewFlags") or \[\]), \*review\_flags\]

return merged

代码 13-3　业务源码：非法信号和越界数值进入复核标记

若模型输出非法标签 BUY\_NOW、超限置信度 130，系统不会自动修正美化，而是强制复用基线数值，并写入 reviewFlags 作为可审计的研究证据。

复核标记是模型评估核心指标：评估模型版本时，除方向命中率外，必须统计非法枚举、数值越界、证据缺失的触发频次。频繁触发兜底回退的模型，不能判定为具备更强行情洞察力。

## 3\. 让异步任务状态可解释

结构化约束不仅作用于信号字段，同样覆盖异步分析任务状态。文件 src/dashboard/signal\_tasks.py 将 LLM 行情分析封装为后台异步任务，定义四类互斥状态：pending、running、done、failed。

前端仅展示空数据，无法区分三类场景：任务未启动、计算中、模型执行报错。标准化状态将模糊区间完全拆分：未完成仅代表计算链路运行中，不等于无行情结论；任务失败代表链路异常，仅 done 状态才可读取完整信号数据。

### 3.1 提交任务并轮询结果

代码 13-4 是 submit\_task 和 poll\_task 的核心路径。submit\_task 创建任务并启动后台线程；poll\_task 根据任务状态返回结果、错误或进行中状态。

import threading

from dashboard.task\_store import create\_task, get\_task, \_run\_task

def submit\_task(symbol: str, model: str) -> Dict\[str, Any\]:

task\_id = create\_task(symbol, model)

thread = threading.Thread(target=\_run\_task, args=(task\_id, symbol, model), daemon=True)

thread.start()

return {"ok": True, "taskId": task\_id, "status": "pending"}

def poll\_task(task\_id: str) -> Dict\[str, Any\]:

task = get\_task(task\_id)

if not task:

return {"ok": False, "message": "task not found"}

status = task.get("status", "pending")

if status == "done":

return {"ok": True, "status": "done", "data": task.get("result") or {}}

if status == "failed":

return {"ok": False, "status": "failed", "message": task.get("error") or "unknown error"}

return {"ok": True, "status": status}

代码 13-4　任务创建与状态轮询

任务没有完成时返回 pending 或 running，它们表示链路正在工作，不表示模型没有结论；任务失败时返回 failed 和错误信息；任务完成时才返回 done 和 data。

### 3.2 用窄口测试固定边界

代码 13-5 是一个窄口测试。它只覆盖结构化信号解析和任务状态，不覆盖未来收益有效性。

$env:PYTHONPATH="src"

$env:DASHBOARD\_DATA\_MODE="offline"

$env:DASHBOARD\_OFFLINE\_SOURCE="fixture"

python -m pytest tests/test\_llm\_signal.py tests/test\_signal\_tasks.py -q

代码 13-5　测试命令：验证结构化信号和任务状态

在当前配套环境中，代码 13-5 返回 7 passed。这只说明结构化路径在当前测试范围内可工作，不说明交易信号有效。

### 3.3 跑一个最小异步示例

代码 13-6 给出一个最小任务示例。它提交任务并轮询到 done 或 failed，适合你用来观察状态转换。离线样本分析可能需要二十多秒，所以这里给 35 秒窗口；如果只给 5 秒，我们很可能会看到 running。

$env:PYTHONPATH="src"

$env:DASHBOARD\_DATA\_MODE="offline"

$env:DASHBOARD\_OFFLINE\_SOURCE="fixture"

@'

import time

from dashboard.signal\_tasks import poll\_task, submit\_task

payload = submit\_task("BTC", "deepseek-v4-pro")

task\_id = payload\["taskId"\]

result = {"status": payload\["status"\]}

deadline = time.time() + 35

while time.time() < deadline and result.get("status") not in {"done", "failed"}:

time.sleep(0.1)

result = poll\_task(task\_id)

print(result.get("status"))

print((result.get("data") or {}).get("signal"))

print((result.get("data") or {}).get("engine"))

'@ | python -

代码 13-6　最小示例：提交并轮询结构化信号任务

在当前离线教学环境中，运行代码 13-6 的一次示例输出如下：

done

WEAK\_SELL

sandbox-rule-based

该结果仅证明异步任务链路可完整运行、结构化字段可正常解析，不代表信号具备行情预测价值。入库前仍需复核数据源快照、证据完整性、枚举合规性，搭配多期回测样本综合评估。

## 4\. 五级失败阻断机制 + Web3 加密市场专属校验规则

将信号全链路异常划分为 5 类标准化失败，每类配套固定拦截动作，杜绝系统自动掩盖缺陷、美化输出。

### 4.1 五级失败阻断机制

表 13-2 定义五类失败各自的处理方式。

| 失败类型 | 例子 | 系统应对 |
| --- | --- | --- |
| 格式失败 | 非 JSON、缺少字段 | 解析失败，记录错误 |
| 枚举失败 | signal="MAYBE\_BUY" | 回退 baseline |
| 数值失败 | confidence=130 | 降级并人工复核 |
| 证据失败 | 摘要引用未提供价格 | 停止进入结论 |
| 状态失败 | 任务异常但无错误信息 | 标记实现问题 |

表 13-2　结构化信号的失败类型与处理方式

图 13-2 读取 SIGNAL\_KEYS，把合法枚举映射到研究评分轴上。它帮助你区分“输出结构合法”和“信号可以进入交易”这两件事。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/42/14/425112e32a5be097169040ba37b0b314.png)

图 13-2　结构化信号枚举与研究评分映射

补充说明：枚举仅为量化统计编码，不等于下单指令。BUY 仅用于样本分组回测，不代表“买入开仓”实盘操作。

### 4.2 Web3 加密市场专属校验规则

加密 Web3 市场存在传统股票所不具备的特殊数据风险，即使基础字段全部合规，仍需执行一层专属阻断校验。表 13-3 给出建议保留的额外阻断条件。

| Web3 额外边界 | 典型表现 | 停止线或复核动作 |
| --- | --- | --- |
| 插针样本污染 | 单一交易所 K 线短时异常，模型解释为趋势突破 | 标记 STOP\_SPIKE\_SAMPLE，先做异常 K 线复核 |
| 资金费率缺失 | 永续合约信号没有纳入 funding 成本 | 标记 REVIEW\_COST\_ASSUMPTION，先复核成本假设 |
| 交易所口径混用 | 价格、成交量、资金费率来自不同交易所 | 标记 STOP\_SOURCE\_MIX，固定单一交易所离线样本 |
| 敏感词风控偏差 | 模型因安全或合规措辞回避具体风险说明 | 降级为研究记录，补充可追溯证据字段 |
| 链上时间戳延迟 | 链上指标与行情切片未对齐 | 标记 REVIEW\_TIMESTAMP，重新确认可见信息集合 |

表 13-3　Web3 结构化信号的额外阻断条件

Web3 数据源统一校验极简代码片段：

def check\_web3\_data\_source(snapshot: Dict\[str, Any\]) -> List\[str\]:

flags = \[\]

source\_list = \[

snapshot.get("price\_source"),

snapshot.get("volume\_source"),

snapshot.get("funding\_source")

\]

unique\_source = set(\[s for s in source\_list if s\])

if len(unique\_source) > 1:

flags.append("STOP\_SOURCE\_MIX")

if snapshot\["contract\_type"\] == "perpetual" and "funding\_rate" not in snapshot:

flags.append("REVIEW\_COST\_ASSUMPTION")

return flags

### 4.3 收益与命中率评估公式（仅事后评估阶段使用）

如果要讨论枚举信号与未来收益的关系，只能在事后评估阶段计算公式（13-1）：

这里的 不能出现在信号生成上下文里。若模型生成信号时看到了未来收益，结构化输出再合法也已经污染。

方向命中率见公式（13-2）：

hit\_rate 只在固定 horizon、固定成本、固定样本切分下有意义。短样本里的高命中率，不能证明模型有稳定优势，更不能替代收益、回撤、换手和成本分析。

命中率不能替代风险解释。一个模型可能方向命中率较高，但每次错判都发生在大波动时；也可能命中率普通，但止损和仓位控制让回撤更低。因此第 13 讲只定义信号契约，第 19 讲才评估收益、回撤和风险调整表现。

## 5\. 入库前置人工复核标准化清单 + 审计日志模板

判断信号能否入库的核心标准：全链路可复现、异常可审计、缺陷可拦截，而非主观“看起来合理”。任意环节无法追溯源码、样本快照，禁止写入正式研究库。表 13-4 是本仓库建议的最小复核清单。

| 检查项 | 通过条件 | 不通过时 |
| --- | --- | --- |
| 输入可追溯 | 能说清数据来自 snapshot、fixture、live 或上游代理 | 标记 STOP\_SOURCE\_UNKNOWN |
| 枚举合法 | signal 属于 SIGNAL\_KEYS | 回退规则基线并写 INVALID\_SIGNAL\_FALLBACK |
| 数值有界 | confidence 在 0 到 100，score 在 -100 到 100 | 回退基线数值并写 reviewFlags |
| 证据完整 | evidence 至少解释技术面、资金 / 筹码、情绪或共识中的主要来源 | 不进入结论，只保留草稿 |
| 风控可执行 | tradePlan 有失效位、目标位或明确的观望理由 | 不进入回测 |
| 状态可解释 | 异步任务最终为 done 或 failed，失败时有错误信息 | 标记实现问题 |

表 13-4　结构化信号入库前的最小复核清单

这张表的价值在于，把“看起来合理”改成“可复算、可拒绝、可审计”。只要某一项不能追到源码、样本或测试，我们就不应把它写成确定结论。

一条合格记录至少写清四项：输入口径、结构化字段、触发的失败标记、人工复核结论。示例格式如下：

symbol=BTC

source=offline fixture

signal=WEAK\_SELL

confidence=12.6

reviewFlags=\[\]

humanReview=通过结构化入库；不升级为交易建议，等待后续样本评估。

标准化日志统一归档所有复核信息，后续研究者可完整复现本次入库的全部校验条件与人工判断依据。

## 总结

这节课我们搭建了一套完整可落地的 LLM 交易信号标准化契约，核心边界：结构化仅解决程序读取问题，无法直接证明信号收益稳定、可直接实盘。一份合规入库信号必须同时覆盖：固定枚举、值域约束、证据溯源、异步任务状态、异常回退逻辑、Web3 专属阻断、人工复核结论。

![](https://static001.geekbang.org/infoq/03/03574be1ecfb3bebc55069ce9aa7e494.jpeg)

下一讲我们学习如何让 Codex 识别幻觉、提示泄漏与未来信息污染。如果第 13 讲没有记录非法枚举、证据缺失和失败状态，第 14 讲就无法判断污染来自模型、上下文还是验证流程。

## 思考与练习

理解题：为什么结构化 JSON 输出不能直接等同于可交易信号？如果模型输出 BUY\_NOW 或 confidence=130，系统应如何处理？

实践题：运行代码 13-1，记录 signal、confidence、score、stopLoss 和 logicFlow 长度；运行代码 13-5，记录测试结果；运行代码 13-6，观察任务状态最终是 done 还是 failed；写一份结构化信号契约，包含合法枚举、数值范围、证据引用和失败处理。

期待你的分享。如果今天的课程让你有所收获，也欢迎转发给有需要的朋友，邀请他来一起学习，我们下节课再见！

公开

同步至部落

取消

完成

0/2000

直线

曲线

AI

2026-08-07给文章提建议

馨冉

Command + Enter 发表

0/2000字符

提交留言

大纲



固定大纲

1\. 先构建规则基线，再定义标准化契约

2\. 搭建 JSON 多层校验门禁，约束模型输出

2.1 清洗模型文本，安全提取 JSON 对象

2.2 非法枚举、超限数值强制回退基线，留存复核标记

3\. 让异步任务状态可解释

3.1 提交任务并轮询结果

3.2 用窄口测试固定边界

3.3 跑一个最小异步示例

4\. 五级失败阻断机制 + Web3 加密市场专属校验规则

4.1 五级失败阻断机制

4.2 Web3 加密市场专属校验规则

4.3 收益与命中率评估公式（仅事后评估阶段使用）

5\. 入库前置人工复核标准化清单 + 审计日志模板

总结

思考与练习