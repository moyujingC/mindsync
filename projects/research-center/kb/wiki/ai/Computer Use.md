# Computer Use

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-12
> source_of_truth：projects/research-center/kb/wiki/ai/Computer Use.md

## 定义

Computer Use（计算机操作能力）指模型或 [[Agent]] [Agent](./Agent.md)（智能体）直接通过图形界面、鼠标、键盘、窗口和屏幕反馈来操作电脑软件的能力。

通俗理解，它不是“系统已经给了正式接口，我去调接口”，而是“像一个人在电脑前点按钮、填表、切窗口那样完成任务”。

## 常见用途

- 没有 API（程序接口）或 [[MCP]] [MCP](./MCP.md)（模型上下文协议）接入时的兜底执行
- 需要跨多个旧系统、桌面软件或网页后台执行的任务
- 自动化一些原本只能人工点击完成的操作

## 边界

- 它通常比正式接口更慢、更脆弱，也更依赖界面稳定性。
- 一旦页面结构、按钮位置或权限弹窗变化，成功率可能明显下降。
- 因此更适合作为兜底层，而不是默认主路径。

## 关联

- [Agent](./Agent.md)
- [MCP](./MCP.md)
- [observability](./observability.md)
