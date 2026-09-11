Codex 与 LLM 量化交易实战课

袁从德

AI 创业公司 CTO，某交易所的前算法负责人

2032 人已学习

查看详情

课程目录

已更新 31 讲/共 38 讲

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

第五章：把研究系统做成可用应用 (5讲)



时长 23:16

时长 19:55

时长 15:31

时长 16:19

时长 22:20

第六章：把 Codex 从一次性助手变成稳定工作流 (1讲)



时长 22:59

袁从德



00:00

1.0x **

讲述：张浩AI版大小：18.67M时长：16:19

<audio title="26｜构建策略回测与风险中心" src="https://res001.geekbang.org/media/tts_audio/20260905/tts-16114-13-1013514/ld/ld.m3u8"></audio>

你好，我是袁从德。

第 25 讲我们把 K 线信号页做成了可复核的证据面板。到了第 26 讲，研究会进入一个更容易让人误判的阶段：信号终于跑出了收益曲线，页面也能显示交易和指标，看起来离“策略”只差一步。

但这一步最危险。单次回测的曲线越清楚，越容易让人忘记追问它的前提：样本窗口有多短，交易次数够不够，成本有没有算进去，回撤是不是集中在少数几笔，样本外是否还能站住，风险中心有没有挡下本不该发生的动作。这节课不教你从图上挑一个最好看的策略，而是训练一套把回测结果降温的阅读方法。

本讲的交付物是一份回测与风控证据包。它要把 /backtests 页面、/risk 页面、后端回测服务、稳健性审计和成本预设放到同一条证据链里。只有当收益、成本、交易数、回撤路径、样本外表现、过拟合检查、风险阻断和停止条件能够互相对上，回测结果才有资格进入下一轮研究；否则，无论页面多完整，都只能写成降级观察或停止放行。

贯穿案例使用仓库当前样本中的 BTC-USDT 与 ma\_crossover。这条线索会故意从一次朴素回测开始，再逐步加入多策略比较、窗口稳定性、滚动向前验证、过拟合概率、组合交叉验证、成本预设和风险中心拒单。学完本讲，你应能回答的不是“这个策略赚钱吗”，而是“这份证据是否足够支持继续推进”。

## 1\. 回测与风控证据的最小契约

开始跑策略前，先把页面职责和实验合同讲清楚。没有这一步，收益率只是一个孤立数字，既不能解释路径风险，也不能说明成本、样本窗口和风控规则是否一致。

图 26-1 先给出本讲的证据链。回测页负责呈现实验结果，风险页负责暴露阻断和停止线；两页共享同一组样本、成本、审计和结论边界，不能各说各话。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/64/5d/644676f17fe5d3f11704bd4ecd2d0b5d.png)

图 26-1　回测页与风险页共享同一条证据链

### 1.1 页面职责

/backtests 负责回答“这次实验在什么假设下产生了什么结果”，/risk 负责回答“哪些越界行为被系统挡住，哪些风险在后测中暴露”。两者不能互相替代。

图 26-2 展示 /backtests 页面里的回测图表。读图时不要只看权益曲线终点，而要同时看样本窗口、K 线价格、买卖标记、平仓点、权益曲线和拖动游标是否处在同一条时间轴上。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/d8/cc/d84bad1139a23ee886ea4c822daf3ecc.png)

图 26-2　回测详情页

| 页面 | 必须展示 | 不能只展示 |
| --- | --- | --- |
| /backtests | 策略、交易对、参数、成本、权益曲线、交易明细、基准对照、审计结论 | 一个收益率数字 |
| /risk | 活跃规则、运行期拒单、拒绝原因、后测风险检查、停止线 | 规则名称列表 |
| 两页共同 | 数据来源、样本窗口、能否继续、是否需要复测 | “页面加载成功” |

表 26-1　策略回测页与风险中心的分工

在这个仓库里，BacktestsPage.tsx 会调用滚动回测服务，并提供 teaching、realistic、perp 成本预设；RiskPage.tsx 从研究报告中读取 risk\_checks、risk\_rejections 和 risk\_rules。页面跑通不等于策略放行，页面只是帮助你把证据看完整。

### 1.2 真实代码入口与实验合同

一次回测实验必须记录清楚输入、样本、成本和风控口径。没有这张合同，后续表格再漂亮也无法解释结果。更重要的是，合同里的每个字段都要能回到真实代码：前端入口主要是 src/web/src/pages/trading/BacktestsPage.tsx、src/web/src/pages/trading/RiskPage.tsx 和 src/web/src/api.ts；后端入口主要是 src/backtest/rolling/service.py、src/backtest/cost\_presets.py、src/backtest/audit/、src/risk/manager.py 和 src/risk/simulation.py。

你不需要一次读完这些文件，但要形成一个习惯：凡是文中出现收益、回撤、拒单、成本预设、PBO 或 CPCV，都应能追到对应函数或字段。

一次回测实验必须记录清楚输入、样本、成本和风控口径。没有这张合同，后续表格再漂亮也无法解释结果。

| 合同项 | 对应字段或文件 | 为什么必须记录 | 缺失时的风险 |
| --- | --- | --- | --- |
| 标的与周期 | symbol、kline\_type | 确定价格样本 | 不同周期结果被混用 |
| 样本窗口 | limit、data\_from、data\_through、warmup\_bars | 确定历史范围和预热区 | 把预热指标当作可交易区 |
| 数据来源 | data\_source、data\_saved\_at | 区分教学样本、快照、实时拉取 | 结果无法复现 |
| 策略版本 | strategy\_key、默认参数、覆盖参数 | 确定信号规则 | 参数漂移后仍写成同一实验 |
| 执行假设 | 止损、止盈、移动止损、最长持仓 | 确定退出逻辑 | 交易明细无法解释 |
| 成本假设 | cost\_preset、commission、slippage、funding | 确定净收益口径 | 毛收益被误当实盘收益 |
| 审计次数 | num\_trials、参数网格 | 支撑 DSR/PBO 判断 | 多次试验后的偶然高 Sharpe 被放大 |
| 风控规则 | risk\_rules、risk\_rejections | 说明动作能否被挡住 | 页面只报收益，不报越界 |

表 26-2　一次回测实验的最小合同

## 2\. 从单次回测到多策略比较

这里我们用 BTC-USDT 的 ma\_crossover 建立最小实验口径，再把它放入同一样本、同一成本预设下做多策略比较。重点不是挑出收益最高者，而是训练一套不会被单次结果诱导的阅读方法。

### 2.1 单次回测实战

先用一个最小实验建立口径：BTC-USDT、ma\_crossover、limit=120、止损 3%、止盈 5%、成本预设 teaching。如果在仓库根目录直接抽跑片段，先让 Python 找到 src/：

$env:PYTHONPATH='src'

代码 26-1 直接调用 /backtests 页面背后的服务函数。它不是为了“证明策略好坏”，而是为了让每个数字都能追到一笔交易、一段权益曲线和一个成本口径。

from backtest.rolling.service import execute\_backtest

payload = execute\_backtest(

strategy\_name="ma\_crossover",

symbol="BTC-USDT",

limit=120,

stop\_loss\_pct=3,

take\_profit\_pct=5,

cost\_preset="teaching",

)

print(payload\["total\_return\_pct"\])

print(payload\["max\_drawdown\_pct"\])

print(payload\["sharpe\_ratio"\])

print(payload\["total\_trades"\])

print(payload\["trades"\]\[0\])

代码 26-1　运行一次可复核的滚动回测

当前代码抽跑结果显示：总收益 -5.21%，最大回撤 5.21%，Sharpe 0.0，交易 1 笔。这笔交易在 entryPrice=64300.6 做多，exitPrice=61079.1 止损退出，持有 4 根 K 线，单笔收益 -5.21%。

这一段真正有复核价值的是字段之间的关系：total\_trades=1 说明统计厚度不足，exitReason=止损 说明亏损来自退出规则，cost\_preset=teaching 说明成本口径仍偏教学。可执行结论不是改参数追回收益，而是降级观察，补样本并进入窗口复核。

### 2.2 多策略比较

单个策略跑出来亏损或盈利，都不代表它已经被充分解释。下一步要把它放进同一交易对、同一样本、同一成本预设下横向比较。

from backtest.rolling.service import compare\_strategies

payload = compare\_strategies(

symbol="BTC-USDT",

limit=120,

cost\_preset="teaching",

)

for row in payload\["strategies"\]:

print(

row\["strategy\_key"\],

row\["total\_return\_pct"\],

row\["max\_drawdown\_pct"\],

row\["sharpe\_ratio"\],

row\["total\_trades"\],

)

代码 26-2　用统一口径比较多条策略

表 26-3 给出同一样本下的多策略压力测试。当前结果中，macd 收益最高，但也只有 -0.33%，并没有真正跑赢到可放行的程度；boll\_mean\_reversion 表现最差，为 -24.85%；buy\_and\_hold 也有 -22.88% 的样本内收益压力和 27.94% 的最大回撤。这里的重点不是“选择最高的”，而是看每条策略是否用同样假设接受了同样复核。

| 策略 | 收益 | 最大回撤 | Sharpe | 交易数 | 判读 |
| --- | --- | --- | --- | --- | --- |
| ma\_crossover | \-5.21% | 5.21% | 0.0 | 1 | 交易太少，不能判断策略全貌 |
| boll\_mean\_reversion | \-24.85% | 24.85% | \-79.46 | 6 | 明显弱于其他策略 |
| rsi\_mean\_reversion | \-4.04% | 8.93% | \-4.17 | 3 | 样本厚度不足 |
| macd | \-0.33% | 15.68% | 0.28 | 15 | 相对不差，但不能放行 |
| buy\_and\_hold | \-22.88% | 27.94% | \-8.39 | 13 | 说明市场窗口本身不利 |

表 26-3　同一 BTC-USDT 样本下的多策略压力测试

这张表给出三个实际判断。

ma\_crossover 的交易数太少，不能把一次止损解释成策略全貌。

macd 虽然排名领先，但收益仍为负，最大回撤达到 15.68%，所以只能写成“相对不差”，不能写成“优胜策略”。

同一窗口里连买入持有基准也大幅回撤，说明市场窗口本身不友好。这时最危险的做法是反复调参，把一个不利窗口硬拟合成好结果。多策略比较的正确用法不是选冠军，而是识别“全体同向亏损”“排名随成本变化”“交易数不足”这些会改变下一步动作的信号。

## 3\. 窗口稳定性与稳健性审计

策略比较只能说明“同一段样本里谁表现更好”，还不能说明结果是否稳定。这里我们把时间窗口、滚动向前验证、DSR、参数扰动、PBO 和 CPCV 连起来，形成回测页进入风险中心前的硬检查。这里的 Walk-forward 指滚动训练与样本外测试，中文可理解为“滚动向前验证”；DSR（Deflated Sharpe Ratio，去偏夏普比率）用来提醒多次试验后的 Sharpe 可能被偶然性抬高；PBO（Probability of Backtest Overfitting，回测过拟合概率）和 CPCV（Combinatorial Purged Cross-Validation，带净化间隔的组合交叉验证）用来观察参数选择和样本外路径是否脆弱。

### 3.1 窗口与滚动向前验证

如果策略只在某一个时间段有效，它很可能是在吃样本运气。compare\_windows 会把样本切成多个窗口，run\_walk\_forward 会在滚动训练和测试中检查样本外表现。

from backtest.rolling.service import compare\_windows, run\_walk\_forward

windows = compare\_windows(

strategy\_name="ma\_crossover",

symbol="BTC-USDT",

limit=120,

cost\_preset="teaching",

)

wfo = run\_walk\_forward(

strategy\_name="ma\_crossover",

symbol="BTC-USDT",

limit=120,

cost\_preset="teaching",

)

print(windows\["positive\_windows"\], windows\["num\_windows"\], windows\["stable"\])

print(wfo\["out\_of\_sample\_return\_pct"\], wfo\["dsr"\], wfo\["overfit\_warning"\], wfo\["num\_trials"\])

代码 26-3　窗口稳定性与滚动向前验证

当前窗口结果很直白：3 个窗口里没有窗口为正，stable=False。滚动向前验证的样本外收益为 -2.6%，DSR 为 0.4481，num\_trials=2，并且 overfit\_warning=True。

这几个字段各有分工：positive\_windows 看同一参数是否跨窗口工作，out\_of\_sample\_return\_pct 看训练期选择到样本外是否还能站住，dsr 和 num\_trials 提醒 Sharpe 可能被多次试验抬高，overfit\_warning 则要求页面降级解释。真正要训练的是，你看到这些谨慎信号同时出现时，能直接把结论写成停止放行，而不是继续调参寻找好看的局部窗口。

本案例的处理动作是停止放行，保留为教学反例：没有正窗口、样本外为负、还出现过拟合警告，已经不是“调两个参数再看”的程度。

### 3.2 参数扰动、PBO 与 CPCV

优化参数最容易把研究带偏。仓库里的 run\_robustness\_audit 会做参数扰动和 PBO，run\_cpcv\_service 会给出组合交叉验证路径分布。Bailey、Borwein、Lopez de Prado 与 Zhu 在 PBO 研究中强调，多次试验后挑出的“最佳”策略可能只是选择偏差；CPCV 的价值不在于制造一个新分数，而在于把样本外路径拆成分布，让你看到结果是不是只靠少数路径撑住。

from backtest.rolling.service import run\_cpcv\_service, run\_robustness\_audit

audit = run\_robustness\_audit(

strategy\_name="ma\_crossover",

symbol="BTC-USDT",

limit=120,

cost\_preset="teaching",

)

cpcv = run\_cpcv\_service(

strategy\_name="ma\_crossover",

symbol="BTC-USDT",

limit=120,

cost\_preset="teaching",

)

print(audit\["parameter\_sensitivity"\]\["stability\_score"\])

print(audit\["pbo"\]\["pbo"\], audit\["pbo"\]\["verdict"\])

print(cpcv\["cpcv"\]\["profitable\_paths\_pct"\], cpcv\["cpcv"\]\["return\_p50"\], cpcv\["cpcv"\]\["verdict"\])

代码 26-4　运行稳健性审计与 CPCV

当前结果仍然不适合放行：参数扰动稳定性分数为 0.8333，PBO 为 0.2 且结论为 strong，但 CPCV 的盈利路径比例为 0.0%，中位数路径收益为 0.0%，结论是 fragile。这类证据冲突很常见，页面不能只挑一个好看的标签展示。

这里有三个容易混淆的判断。

参数扰动看的是结果是不是“平台型”：如果最优参数附近的小网格也能维持相近表现，可信度高于孤立尖峰；stability\_score=0.8333 只能说明本次小幅扰动没有立刻打碎结果。

PBO 看的是“赢家挑选风险”：多次试验后挑出的最好策略可能只是选择偏差；pbo=0.2 说明当前搜索中的过拟合信号不高，但它不等于样本外可盈利。

CPCV 看的是样本外路径分布：profitable\_paths\_pct=0.0% 说明组合路径里没有盈利路径，verdict=fragile 直接把结论压回“停止放行”。

稳健性审计不是少数服从多数，而是寻找足以改变决策的反证。

| 证据组合 | 应写成 | 不应写成 |
| --- | --- | --- |
| 参数扰动稳定、PBO 低、CPCV 多数盈利 | 初步稳健，仍需成本和风控复核 | 已经可交易 |
| 参数扰动不稳、PBO 低 | 参数敏感，需要复测 | 过拟合风险低所以通过 |
| PBO 高、CPCV 中位数为正 | 选择偏差风险高，需要减少搜索或重做验证 | 样本外仍赚钱所以通过 |
| CPCV 盈利路径少或为零 | 路径脆弱，停止放行 | 单次回测收益为正 |
| DSR 不显著但收益为正 | 统计显著性不足 | Sharpe 好看所以通过 |

表 26-4　稳健性证据冲突的判读规则

图 26-3 可以读出四件事：参数扰动是在找平台，不是在找孤立最优点；PBO 是在问这是不是试验后挑出来的赢家；CPCV 是在看样本外路径是否成片失效；结论门禁以最强反证为准。只要 CPCV 给出 fragile，页面就不能写成“策略通过”，即使参数扰动和 PBO 看起来不差。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/1f/c7/1f31b06611b792cc693e282c99e490c7.png)

图 26-3　稳健性审计要同时看参数扰动和样本外路径分布

## 4\. 风险中心与成本预设

回测结果进入产品页面后，还要接受两类复核：风险中心解释阻断，成本预设解释执行假设。这里我们把两者放在一起，是为了强调绩效不是策略单独生成的，而是策略、执行假设和风控规则共同生成的。

### 4.1 风险中心数据读取

风险中心的重点不是“有几个规则”，而是“规则有没有在关键时刻挡住越界动作”。本仓库的 research.report.build\_report(short=3, long=7) 会生成一份事件驱动样本报告，里面包含运行期风控拒绝和后测风险检查。它和滚动回测页不是同一个实验样本，但共同服务于同一个页面职责：风险证据必须可解释。

from research.report import build\_report

report = build\_report(short=3, long=7)

print(report\["backtest"\]\["risk\_rules"\])

print(len(report\["backtest"\]\["risk\_rejections"\]))

print(report\["backtest"\]\["risk\_rejections"\]\[0\])

print(report\["risk\_checks"\])

代码 26-5　读取风险中心的规则、拒单和后测检查

这份报告中活跃规则包括 EMERGENCY\_HALT、MAX\_POSITION\_PCT、MAX\_DAILY\_LOSS\_PCT、MAX\_SLIPPAGE\_PCT、ABNORMAL\_ORDERBOOK。运行期一共有 176 次 MAX\_DAILY\_LOSS\_PCT 拒绝；第一笔拒绝发生在 2025-03-31 的 BUY 意图上，原因是权益 8464.93 已经比峰值 10000 低 15.35%，超过允许的 15.00% 停止线。

这里的常见误区是，把风险中心写成“规则栈已启用”。启用规则不等于产生约束，真正改变结论的是拒单明细：看 rule\_id 确认哪条规则拦截，看 side 和 date 确认拦截发生在哪个订单意图上，看 reason 确认阈值和当前值是否可复核。若页面只显示 5 条规则，却不显示 15.35% > 15.00% 这样的停止线证据，你无法判断系统是在保护资金，还是只是在展示风控名词。（见表 26-5）

| 字段 | 本次样本值 | 页面应解释什么 |
| --- | --- | --- |
| rule\_id | MAX\_DAILY\_LOSS\_PCT | 哪条规则真正拦截了订单，而不是只列出启用规则 |
| date | 2025-03-31 | 拦截发生在哪个回测时间点 |
| side | BUY | 被拦截的是买入、卖出还是减仓意图 |
| equity | 8464.93 | 触发风控时账户权益已经降到哪里 |
| peak\_equity | 10000.00 | 回撤计算使用的峰值基准 |
| drawdown\_pct | 15.35% | 当前风险暴露是多少 |
| threshold\_pct | 15.00% | 规则允许的最大日内亏损线 |
| reason | 15.35% > 15.00% | 页面必须把当前值和阈值同时展示出来 |

表 26-5　风险中心拒单明细要能复核阈值和当前值

风险中心页面还要把“运行期阻断”和“回测后复核”拆开呈现。前者发生在订单意图进入成交模拟前，例如 MAX\_DAILY\_LOSS\_PCT 拒绝 BUY；后者发生在回测完成后，例如最大回撤过高、交易数过少或胜率异常。

页面的合格标准很朴素：规则栈要来自当前数据，拒单要有 rule\_id、方向、时间和原因，停止线要同时展示阈值和当前值，决策语言要落在“继续、复测、修改、停止”这些动作上，而不是只写成功或失败。

图 26-4 是当前风控中心页面的截图。读这张图时，重点不是看页面是否“信息很多”，而是看它是否把规则、拒单、阈值、当前值和动作分流放在同一个证据面板里。

![](https://static001.geekbang.org/editor-compose/resourceimage/compose/fd/58/fd4018e4128aa7164e14ee7cdcaf5258.png)

图 26-4　风控中心页面

### 4.2 成本预设比较

成本预设会直接改变回测结论。teaching 适合教学演示，realistic 加入滑点，perp 进一步加入资金费率。QuantConnect 的 Reality Modeling 文档，把手续费、滑点、成交、保证金和风险模型都放在回测现实性里讨论，原因也是同一个：策略信号本身不产生可交易收益，执行假设会吞掉或改变收益。代码 26-6 用同一个策略、同一个样本，比较三组成本。

from backtest.rolling.service import execute\_backtest

for preset in \["teaching", "realistic", "perp"\]:

payload = execute\_backtest(

strategy\_name="ma\_crossover",

symbol="BTC-USDT",

limit=120,

stop\_loss\_pct=3,

take\_profit\_pct=5,

cost\_preset=preset,

)

print(

preset,

payload\["total\_return\_pct"\],

payload\["max\_drawdown\_pct"\],

payload\["commission\_pct"\],

payload\["slippage\_pct"\],

payload\["funding\_rate\_pct"\],

)

代码 26-6　同一策略下比较成本预设

当前输出显示，成本假设越接近交易现实，收益越低、回撤越高：teaching 收益 -5.21%、最大回撤 5.21%；realistic 收益 -5.48%、最大回撤 5.48%；perp 收益 -5.60%、最大回撤 5.60%。这组三个数字差异很小，但结论很明确，直接并入表 26-6，更利于复核。

| 预设 | 本讲输出 | 当前代码含义 | 适合用途 | 不适合用途 |
| --- | --- | --- | --- | --- |
| teaching | 收益 -5.21%，回撤 5.21% | commission 0.1%，slippage 关闭，funding 0 | 解释回测流程和图表字段 | 不能当真实交易成本 |
| realistic | 收益 -5.48%，回撤 5.48% | commission 0.1%，基础滑点 0.05%，动态滑点开启 | 观察成本敏感性 | 仍不是交易所逐笔撮合 |
| perp | 收益 -5.60%，回撤 5.60% | 在 realistic 基础上加入 funding | 教学永续合约成本影响 | 不能替代真实资金费率曲线 |

表 26-6　成本预设的教学边界

如果策略只在 teaching 下盈利，换到 realistic 或 perp 后变弱，页面应该把结论降级为“成本敏感，需要复测”。本讲样本更直接：三组成本下都为负，且成本越重结果越弱，因此它适合用来教学“成本口径必须随结果一起展示”。

一个小型反例更能说明问题：假设某策略在 teaching 下只有 0.2% 的正收益，但交易频率很高。若 realistic 的 slippage\_pct=0.05 和动态滑点打开后收益转负，它不是“略微变差”，而是交易优势被执行成本吞噬。可执行处理不是继续宣称策略领先，而是把状态改为“成本敏感”，要求减少交易频率、换成本模型或停止研究。

## 总结

这节课我们把策略回测页和风险中心连成一条可复核路径。回测页负责呈现收益、回撤、交易明细、成本预设、窗口稳定性和稳健性审计；风险中心负责解释规则、拒单、阈值和停止线。两者不能互相替代，也不能各自给出互相矛盾的结论。

![](https://static001.geekbang.org/resource/image/7b/c3/7b712e4e7b30a094e0d50e9b5898d6c3.jpeg)

因此，本讲样本的正确交付不是“发现一个好策略”，而是“建立一套能阻止误判的回测与风控证据链”。这条证据链也给第 27 讲留下明确入口：浏览器验收不能只看页面是否加载成功，还要确认页面是否完整呈现回测、风险和错误状态。

## 思考与练习

边界判断：如果 PBO 不高，但 CPCV 路径中位数收益为负，你会如何给出页面结论？

实践复核：修改 cost\_preset，重新运行代码 26-6，并记录表 26-6 中收益、回撤和 Sharpe 的变化。

期待你的分享。如果今天的课程让你有所收获，也欢迎转发给有需要的朋友，邀请他来一起学习，我们下节课再见！

公开

同步至部落

取消

完成

0/2000

直线

曲线

AI

2026-09-07给文章提建议

馨冉

Command + Enter 发表

0/2000字符

提交留言

大纲



固定大纲

1\. 回测与风控证据的最小契约

1.1 页面职责

1.2 真实代码入口与实验合同

2\. 从单次回测到多策略比较

2.1 单次回测实战

2.2 多策略比较

3\. 窗口稳定性与稳健性审计

3.1 窗口与滚动向前验证

3.2 参数扰动、PBO 与 CPCV

4\. 风险中心与成本预设

4.1 风险中心数据读取

4.2 成本预设比较

总结

思考与练习