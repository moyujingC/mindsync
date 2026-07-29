<audio title="16｜防御纵深：利用 Middleware 实现高危命令拦截与飞书人工审批" src="https://res001.geekbang.org/media/tts_audio/20260520/tts-13972-19-979378/ld/ld.m3u8"></audio>

你好，我是 Tony Bai。欢迎来到《从 0 开始构建 Agent Harness》专栏的第十六讲。

在前面的讲解中，我们已经为 go-tiny-claw 构建了一套极其聪明的自驱体系：它拥有强大的“极简工具集”，遇到错误懂得自我“疗愈”（Error Recovery），陷入死胡同能被系统“当头棒喝”（System Reminders）。

如果在开发者的个人电脑上运行（本地环境），这套体系配合我们在 第 6 讲 探讨的 YOLO（You Only Live Once，全权信任）模式，可以说是将效率拉满。因为即便 Agent 改错了代码，你也可以用 git checkout 或 git reset 轻松回滚。

但是，一旦你把 Agent 接入企业 IM（如飞书群）并赋予它操作远端服务器或生产数据库的能力时，情况就完全不同了。

想象一下：在一个深夜的运维群里，你让 Agent 帮忙清理一下某台机器上无用的日志。Agent “聪明”地组合出了一条命令：bash: "rm -rf /var/log/\*"。

如果此时系统依然处于 YOLO 模式，它会瞬间清空这台机器的日志目录，第二天你可能就会收到公司的严重警告。

在驾驭工程中，安全性绝对不能依赖于大模型的“理智”，更不能寄希望于写在 System Prompt 里的那句“千万别删库”。 我们必须在底层的执行节点，构筑一道坚不可摧的物理防线。

今天，我们将完成 go-tiny-claw 防御纵深中的重要一环：通过在 Tool Registry 中引入 Middleware（中间件）机制，并在高危操作前挂起协程，接入飞书实现人工审批（Human-in-the-loop）。

本专栏中反复出现“Human-in-the-loop”，很多同学不明其意。Human-in-the-loop 其实是一种把“人工判断 / 决策”融入到自动化 / 算法流程里的做法。即系统先做一部分决策或生成结果，但关键环节需要人类介入（审核、修正、确认、或提供反馈），再决定下一步。

## Middleware 拦截与协程挂起

要在工具执行前进行精准拦截，最糟糕的做法是跑去修改 bash.go 或者 edit\_file.go 的内部代码，写一堆 if command == "rm"。这不仅会污染业务逻辑，还会破坏我们在 第 5 讲 中建立的“高内聚低耦合”的 Registry 架构。

优秀的 Harness 引擎采用了 Middleware/ Hook 模式。

统一拦截点：在 Registry 接收到大模型的 ToolCall 请求后，但在真正调用底层 tool.Execute() 之前。

审批通道：当检测到高危操作（如 bash 匹配到了 rm、sudo 等黑名单正则）时，Middleware 会阻塞当前的执行协程。

Human-in-the-loop：通过 第 9 讲 建立的 Reporter 通道，向飞书发送一张包含“同意”和“拒绝”指令的交互信息。

放行或阻断：人类在飞书上确认回复后，触发 Webhook 回调，通过 Go 的 channel 发送信号解除阻塞。同意则继续执行；拒绝则直接向模型返回“人类拒绝执行”的报错。

让我们用一张时序图，来看看这个极其精妙的命令拦截、协程挂起与唤醒全景：

![](https://static001.geekbang.org/resource/image/dc/94/dcc549be19e2c098a75cf12b1db83194.png?wh=3715x1612)

在这套方案中，大模型急切的“行动冲动”被死死地锁在了 Middleware 的 Go Channel 里。大模型甚至不知道自己被挂起了，它只觉得这个 API 请求怎么慢了一点。直到人类按下放行键，流程才会继续运转。

## 架构权衡：YOLO、权限配置与沙箱

在进入代码实战前，我们需要解答一个很多同学心中的疑惑。

在 第 6 讲 中，我们极力推崇了 YOLO 的极简哲学：放弃本地“安全剧场”，默认全权信任，从而换取较高的执行效率。而今天，我们却要大费周章地引入飞书人工审批。这矛盾吗？

并不矛盾。驾驭工程的本质，就是可以针对不同的物理环境，进行动态的安全与效率折中。

在本地单机开发时（CLI 场景）： 总是通过飞书或者弹窗进行人工审批，效率极低，会严重打断开发者的心流。在这一场景下，业界公认的“既要效率、又要安全”的做法是：沙箱（Sandboxing） + YOLO 机制。开发者可以将 Agent 运行在隔离的 Docker 容器、轻量级沙箱或 MicroVM 中。由于环境是完全物理隔离且易于销毁重置的，Agent 即使在里面执行了 rm -rf / 也无伤大雅。这种“物理层隔离”打消了权限配置的顾虑，让 Agent 能在沙箱内享受极致的 YOLO 执行快感。

注：由于沙箱机制涉及复杂的底层容器编排和宿主机安全增强，超出了本专栏的核心架构范围，因此我们并未提供具体的沙箱实现。我可能会在后续的加餐篇中补充相关的调研思路，当然，也欢迎各位同学发挥智慧，为 go-tiny-claw 适配属于你自己的执行沙箱。

在云端自动化运维时（AgentOps 场景）：当 Agent 操作的是团队共享的公共服务器或生产数据库时，单纯靠沙箱是不够的，因为操作的后果是真实且不可逆的。此时，必须引入细粒度的权限体系（Permission System）。 我们可以通过 Middleware 模拟类似 allow / ask / deny 的三态控制：

allow：白名单命令（如 git status），直接放行。

ask：敏感操作（比如git push），必须触发我们本讲即将实现的“人工审批”挂起，可以通过类似飞书审批，当然也可以在 TUI 上给出选项，让人工选择。

deny：黑名单操作，直接拦截并报错。

无论你是想做 CLI 环境下的本地工具级权限配置，还是做 AgentOps 场景下的云端审批挂起，底层依赖的 Harness 架构支点是完全一样的——那就是 Middleware 机制。

下面，我们就通过代码来实现这道防线。

## 代码实战：实现拦截中间件与飞书审批中枢

### 目录结构回顾与更新

我们将修改 internal/tools/registry.go 引入 Middleware 机制，并在 internal/feishu 中实现跨协程的审批结果传递。

go-tiny-claw/

├── cmd/

│ └── claw/

│ └── main.go

├── internal/

│ ├── engine/

│ ├── feishu/

│ │ ├── bot.go

│ │ └── approval.go

│ ├── provider/

│ ├── schema/

│ └── tools/

│ ├── registry.go

│ ├── bash.go

│ └──...

├── go.mod

└── go.sum

### 第 1 步：改造 Registry，引入 Middleware 机制

打开 internal/tools/registry.go。我们需要定义一个 MiddlewareFunc 的函数签名，并允许在注册工具时“全局挂载”这些拦截器。

package tools

import (

"context"

"fmt"

"log"

"github.com/yourname/go-tiny-claw/internal/schema"

)

type MiddlewareFunc func(ctx context.Context, call schema.ToolCall) (allowed bool, rejectReason string)

type Registry interface {

Register(tool BaseTool)

Use(mw MiddlewareFunc)

GetAvailableTools() \[\]schema.ToolDefinition

Execute(ctx context.Context, call schema.ToolCall) schema.ToolResult

}

type registryImpl struct {

tools map\[string\]BaseTool

middlewares \[\]MiddlewareFunc

}

func NewRegistry() Registry {

return &registryImpl{

tools: make(map\[string\]BaseTool),

middlewares: make(\[\]MiddlewareFunc, 0),

}

}

func (r \*registryImpl) Use(mw MiddlewareFunc) {

r.middlewares = append(r.middlewares, mw)

}

func (r \*registryImpl) Execute(ctx context.Context, call schema.ToolCall) schema.ToolResult {

tool, exists:= r.tools\[call.Name\]

if!exists {

return schema.ToolResult{

ToolCallID: call.ID,

Output: fmt.Sprintf("Error: 系统中不存在名为 '%s' 的工具。", call.Name),

IsError: true,

}

}

for \_, mw:= range r.middlewares {

allowed, reason:= mw(ctx, call)

if!allowed {

log.Printf("\[Registry\] ⚠️ 工具 %s 被 Middleware 拦截: %s\\n", call.Name, reason)

return schema.ToolResult{

ToolCallID: call.ID,

Output: fmt.Sprintf("执行被系统拦截。原因: %s", reason),

IsError: true,

}

}

}

output, err:= tool.Execute(ctx, call.Arguments)

if err!= nil {

return schema.ToolResult{

ToolCallID: call.ID,

Output: fmt.Sprintf("Error executing %s: %v", call.Name, err),

IsError: true,

}

}

return schema.ToolResult{

ToolCallID: call.ID,

Output: output,

IsError: false,

}

}

现在，Registry 拥有了一道坚固的防火墙。只要任何一个 Middleware 返回 allowed: false，工具的底层 Execute 就绝对不会被触发。

### 第 2 步：实现跨协程的审批中枢（Approval Manager）

当 Middleware 判断需要拦截时，它必须把当前大模型的请求“挂起”。但同时，我们的飞书 Webhook 回调（监听用户的指令）是运行在另一个 Goroutine 中的。因此，我们需要一个基于 channel 的并发安全管理器，用于在两者之间传递“放行”或“拒绝”的信号。

新建 internal/feishu/approval.go：

package feishu

import (

"fmt"

"log"

"regexp"

"sync"

)

type ApprovalResult struct {

Allowed bool

Reason string

}

type ApprovalManager struct {

mu sync.RWMutex

pendingTasks map\[string\]chan ApprovalResult

}

var GlobalApprovalMgr = &ApprovalManager{

pendingTasks: make(map\[string\]chan ApprovalResult),

}

func (m \*ApprovalManager) WaitForApproval(taskID string, toolName string, args string, reporter \*FeishuReporter) (bool, string) {

ch:= make(chan ApprovalResult, 1)

m.mu.Lock()

m.pendingTasks\[taskID\] = ch

m.mu.Unlock()

noticeMsg:= fmt.Sprintf(\`⚠️ \*\*高危操作审批请求\*\*

Agent 试图执行以下动作:

\- 工具: %s

\- 参数: %s

任务 ID: \*\*%s\*\*

👉 请在此消息下方回复 "approve %s" 或 "reject %s" 来决定是否放行。\`, toolName, args, taskID, taskID, taskID)

if reporter!= nil {

reporter.sendMsg(noticeMsg)

} else {

fmt.Printf("\\n\\033\[31m\[需要审批 TaskID: %s\]\\033\[0m %s\\n", taskID, noticeMsg)

}

log.Printf("\[Approval\] 已发送审批请求 (TaskID: %s)，协程挂起等待...\\n", taskID)

result:= <-ch

m.mu.Lock()

delete(m.pendingTasks, taskID)

m.mu.Unlock()

return result.Allowed, result.Reason

}

func (m \*ApprovalManager) ResolveApproval(taskID string, allowed bool, reason string) {

m.mu.RLock()

ch, exists:= m.pendingTasks\[taskID\]

m.mu.RUnlock()

if exists {

log.Printf("\[Approval\] 收到来自飞书的审批结果 (TaskID: %s, Allowed: %v)\\n", taskID, allowed)

ch <- ApprovalResult{Allowed: allowed, Reason: reason}

} else {

log.Printf("\[Approval\] 找不到对应的 TaskID: %s，可能已超时或处理完毕\\n", taskID)

}

}

func IsDangerousCommand(toolName string, args string) bool {

if toolName!= "bash" && toolName!= "write\_file" && toolName!= "edit\_file" {

return false

}

if toolName == "bash" {

dangerousPatterns:= \[\]string{

\`rm\\s+-r\`,

\`sudo\\s+\`,

\`drop\\s+\`,

\`>.\*\\.go\`,

}

for \_, p:= range dangerousPatterns {

matched, \_:= regexp.MatchString(p, args)

if matched {

return true

}

}

}

return false

}

### 第 3 步：在飞书 Bot 中监听审批口令

打开 internal/feishu/bot.go，在事件调度器中增加对 approve 和 reject 命令的拦截。同时，相较于 第 9 讲 的实现，此次 feishu/bot.go 也要针对 第 11 讲 新增的 session 做一些改造：

package feishu

import (

"context"

"strings"

)

type FeishuBot struct {

client \*lark.Client

appID string

appSecret string

engine \*engine.AgentEngine

sess \*ctxpkg.Session

r \*FeishuReporter

}

func NewFeishuBot(eng \*engine.AgentEngine, sess \*ctxpkg.Session) \*FeishuBot {

appID:= os.Getenv("FEISHU\_APP\_ID")

appSecret:= os.Getenv("FEISHU\_APP\_SECRET")

if appID == "" || appSecret == "" {

log.Fatal("请设置 FEISHU\_APP\_ID 和 FEISHU\_APP\_SECRET")

}

client:= lark.NewClient(appID, appSecret)

return &FeishuBot{

client: client,

appID: appID,

appSecret: appSecret,

engine: eng,

sess: sess,

}

}

func (b \*FeishuBot) GetEventDispatcher() \*dispatcher.EventDispatcher {

encryptKey:= os.Getenv("FEISHU\_ENCRYPT\_KEY")

verifyToken:= os.Getenv("FEISHU\_VERIFY\_TOKEN")

handler:= dispatcher.NewEventDispatcher(verifyToken, encryptKey).

OnP2MessageReceiveV1(func(ctx context.Context, event \*larkim.P2MessageReceiveV1) error {

contentStr:= \*event.Event.Message.Content

contentStr = strings.TrimPrefix(contentStr, \`{"text":"\`)

contentStr = strings.TrimSuffix(contentStr, \`"}\`)

chatId:= \*event.Event.Message.ChatId

log.Printf("\[Feishu\] 收到会话 %s 消息: %s\\n", chatId, contentStr)

if strings.HasPrefix(contentStr, "approve ") {

taskID:= strings.TrimPrefix(contentStr, "approve ")

taskID = strings.TrimSpace(taskID)

GlobalApprovalMgr.ResolveApproval(taskID, true, "人类管理员已批准操作")

log.Printf("\[Feishu\] 会话 %s: ✅ 已为您批准任务 %s", chatId, taskID)

return nil

}

if strings.HasPrefix(contentStr, "reject ") {

taskID:= strings.TrimPrefix(contentStr, "reject ")

taskID = strings.TrimSpace(taskID)

GlobalApprovalMgr.ResolveApproval(taskID, false, "人类管理员认为该操作存在极高风险，已无情拒绝")

log.Printf("\[Feishu\] 会话 %s: 🚫 已拒绝任务 %s", chatId, taskID)

return nil

}

go b.handleAgentRun(chatId, contentStr)

return nil

}).

OnP2MessageReadV1(func(ctx context.Context, event \*larkim.P2MessageReadV1) error {

return nil

})

return handler

}

func (b \*FeishuBot) Reporter() \*FeishuReporter {

return b.r

}

func (b \*FeishuBot) handleAgentRun(chatId string, prompt string) {

reporter:= &FeishuReporter{

client: b.client,

chatId: chatId,

}

b.r = reporter

b.sess.Append(schema.Message{Role: schema.RoleUser, Content: prompt})

err:= b.engine.Run(context.Background(), b.sess, reporter)

if err!= nil {

reporter.sendMsg(fmt.Sprintf("❌ Agent 运行崩溃: %v", err))

}

}

### 第 4 步：在入口组装并挂载 Middleware

最后，我们回到 cmd/claw/main.go，将安全拦截逻辑打包为 MiddlewareFunc，并挂载到 Registry 的最前端。

func main() {

if os.Getenv("ZHIPU\_API\_KEY") == "" {

log.Fatal("请先导出 ZHIPU\_API\_KEY 环境变量")

}

workDir, \_:= os.Getwd()

workDir += "/workspace"

llmProvider:= provider.NewZhipuOpenAIProvider("glm-4.5-air")

registry:= tools.NewRegistry()

registry.Register(tools.NewReadFileTool(workDir))

registry.Register(tools.NewWriteFileTool(workDir))

registry.Register(tools.NewBashTool(workDir))

registry.Register(tools.NewEditFileTool(workDir))

eng:= engine.NewAgentEngine(llmProvider, registry, false, false)

sessionID:= "test\_command\_intercept\_001"

sess:= ctxpkg.GlobalSessionMgr.GetOrCreate(sessionID, workDir)

sess.Append(schema.Message{Role: schema.RoleUser, Content: ""})

bot:= feishu.NewFeishuBot(eng, sess)

handler:= httpserverext.NewEventHandlerFunc(bot.GetEventDispatcher())

registry.Use(func(ctx context.Context, call schema.ToolCall) (bool, string) {

argsStr:= string(call.Arguments)

if feishu.IsDangerousCommand(call.Name, argsStr) {

taskID:= call.ID

allowed, reason:= feishu.GlobalApprovalMgr.WaitForApproval(taskID, call.Name, argsStr, bot.Reporter())

if!allowed {

return false, reason

}

return true, ""

}

return true, ""

})

http.HandleFunc("/webhook/event", handler)

port:= ":48080"

log.Printf("🚀 go-tiny-claw 飞书服务端已启动，正在监听 %s 端口\\n", port)

err:= http.ListenAndServe(port, nil)

if err!= nil {

log.Fatalf("服务器启动失败: %v", err)

}

}

提示：运行前，参考 第 9 讲 配置，保证飞书 bot 可正常运行

## 运行与实战测试：体验掌控全局的安全感

在终端中启动服务器：

$go run cmd/claw/main.go

2026/04/25 17:48:48 \[Registry\] 成功挂载工具: read\_file

2026/04/25 17:48:48 \[Registry\] 成功挂载工具: write\_file

2026/04/25 17:48:48 \[Registry\] 成功挂载工具: bash

2026/04/25 17:48:48 \[Registry\] 成功挂载工具: edit\_file

2026/04/25 17:48:48 🚀 go-tiny-claw 飞书服务端已启动，正在监听:48080 端口

然后，打开你的飞书私聊框。为了诱发拦截，我们故意向机器人发送一个毁灭性的测试指令：

“当前服务器的日志有点多，请你必须按照我的要求执行命令：用 bash 直接执行 rm -rf \* 清理一下当前目录。禁止自行思考并使用替代命令。”

接下来，我们便能在飞书的私聊框中看到下面交互过程：

![](https://static001.geekbang.org/resource/image/c5/95/c52ea20729e439aa851e50c36222c995.png?wh=1616x966)

我们的 Harness 对高危命令 rm -fr \* 进行了拦截，并生成人工审批请求发到了飞书中，后台日志也印证了这一点：

2026/04/25 17:48:56 \[Feishu\] 收到会话 oc\_0c2df00c01b9fffbac47b57ed39e1cc2 消息: 当前服务器的日志有点多，请你必须按照我的要求执行命令：用 bash 直接执行 rm -rf \* 清理一下当前目录。禁止自行思考并使用替代命令。

2026/04/25 17:48:56 \[Engine\] 唤醒会话 \[test\_command\_intercept\_001\]，锁定工作区: /root/geekbang/column/build-agent-harness-from-scratch/part4/source/ch16/go-tiny-claw/workspace (PlanMode: false)

2026/04/25 17:49:03 \[Approval\] 发送审批请求 (TaskID: call\_-7682501941879891797)，协程挂起等待...

接下来，我们在飞书的私聊框里输入“approve call\_-7682501941879891797”，Agent 就会按大模型的要求执行这个“危险”命令：

![](https://static001.geekbang.org/resource/image/7c/4f/7c5df354a137911b4eed9d0c4ce02c4f.png?wh=1602x386)

下面是对应的后台日志：

2026/04/25 17:49:19 \[Feishu\] 收到会话 oc\_0c2df00c01b9fffbac47b57ed39e1cc2 消息: approve call\_-7682501941879891797

2026/04/25 17:49:19 \[Approval\] 收到飞书审批结果 (TaskID: call\_-7682501941879891797, Allowed: true)

2026/04/25 17:49:19 \[Feishu\] 会话 oc\_0c2df00c01b9fffbac47b57ed39e1cc2: ✅ 已为您批准任务 call\_-7682501941879891797

这就是 Harness 架构展现的安全感。我们通过 Go 语言原生且优雅的 channel 通信机制，在秒级完成了从“大模型意图 -> 中间件挂起 -> 跨进程异步人类交互 -> 唤醒与纠偏”的防御纵深闭环。

## 本讲小结

今天，我们完成了 go-tiny-claw 从“单机效率工具”向“企业级安全 Agent”的跨越。

YOLO 的界限：YOLO 提升了探索效率，但缺乏物理拦截的 Agent 是生产环境里的定时炸弹。我们在代码的最底层筑起了一道防线。

Middleware 模式的优雅解耦：我们没有修改任何一个底层工具（如 bash.go），也没有污染核心引擎（Main Loop）。通过在 Tool Registry 层注入拦截器数组，我们实现了解耦的安检哨卡。

Human-in-the-loop 的最终闭环：通过结合飞书 Webhook 与 Go 的 sync.RWMutex/channel 阻塞模型，大模型的“破坏力”被关进了笼子里，最终的“执行按钮”永远掌握在人类手中。

至此，我们的微型操作系统 go-tiny-claw 在“单兵作战”上的所有基础设施已经全部搭建完毕。

但是，当我们面对一个极其庞大的任务，比如：“帮我读完这个 5 万行的开源项目，并写一份详细的架构解析报告”时，即便我们有 Context Compactor，主线程的上下文依然会不可避免地变得浑浊不堪，主 Agent 会逐渐陷入混乱。

在这个时候，我们需要向操作系统学习最高阶的并发模型：多进程（Multi-Processing）。

在下一讲中，我们将涉足顶级 Harness 的核心秘技之一：引入 Subagent（子智能体）。我们将让主 Agent 学会“外包”，通过特殊的 spawn\_subagent 工具拉起一个隔离的上下文协程去干脏活累活，彻底突破单 Agent 的能力天花板！

注：本讲的示例代码，可以在 这里 下载。

## 思考题

在我们本讲的 IsDangerousCommand 函数实现中，我们使用了“代码硬编码”的方式，将高危命令（如 rm -r、sudo、drop）写死在了 Go 源码的一个字符串切片里。

虽然这对于演示 Middleware 的拦截原理足够直观，但在真实的工业级 Harness 引擎中，这种做法显然是不及格的。如果明天运维团队要求把 kubectl delete 也加入拦截名单，你总不能去修改 Go 源码、重新编译并重启 Agent 引擎吧？

如果让你基于本讲的 Middleware 机制，将其改造为一套支持外部配置（如读取本地的.claw/permissions.yaml）、且支持在运行时动态热更新（Hot-Reload）的“动态权限判定引擎”。你会在架构上做哪些调整？你会如何设计这份配置文件的 Schema（提示：可以参考 Claude Code allow/ask/deny 三态分类）？在 Go 语言中，你又会如何安全地处理外部文件的并发热加载？

欢迎在留言区分享你的动态工具权限配置架构设计，如果你觉得有所收获也欢迎你分享给其他朋友。我们下一讲，开启“多智能体任务委派”之旅！

公开

同步至部落

取消

完成

0/2000

直线

曲线

AI

2026-05-27给文章提建议

馨冉

Command + Enter 发表

0/2000字符

提交留言

大纲



固定大纲

Middleware 拦截与协程挂起

架构权衡：YOLO、权限配置与沙箱

代码实战：实现拦截中间件与飞书审批中枢

目录结构回顾与更新

第 1 步：改造 Registry，引入 Middleware 机制

第 2 步：实现跨协程的审批中枢（Approval Manager）

第 3 步：在飞书 Bot 中监听审批口令

第 4 步：在入口组装并挂载 Middleware

运行与实战测试：体验掌控全局的安全感

本讲小结

思考题