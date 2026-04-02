# App

这里放 `aicareer` 第一版实现入口和流程编排代码。

职责：

- 接收输入
- 调用领域流程
- 输出 `career_asset`
- 当前入口：`generate-career-asset.js`
- CLI 入口：`run-cli.js`

CLI 当前支持：

- 交互式输入
- `--review <json-path>` 加载 review 反馈
- `--interactive-review` 直接在 CLI 中输入 review 反馈
- `--save-workflow <json-path>` 保存本次输入为 workflow JSON
- `--from-workflow <json-path>` 从已有 workflow JSON 继续生成
- `--output <file-path>` 保存 Markdown 输出
- `--auto-archive` 按时间戳自动保存 workflow 和输出
- `--list-archives` 查看最近归档

不在这里放：

- 复杂领域规则
- 测试代码
- 样本数据
