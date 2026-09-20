# HiStyle 架构拆解

> 版本：0.1.0
> last_updated：2026-09-21
> 对象：HISTYLE.app v0.1.94（Electron）
> 口径：本文为个人学习笔记；所有 HiStyle 资产仅作参考，不进开源仓。

## 一句话架构

Electron 壳 + 调用用户本机自装的 Codex CLI（烧用户自己的 API Key）+ HTML 处理管线（cheerio/css-tree/juice/mammoth/turndown）。提示词和风格文档在服务器，按次取、用完即弃。

## 管线（从依赖与代码字符串还原）

1. 输入：md / docx（mammoth 转 HTML）/ 粘贴文本
2. 生成许可：`POST /api/account/generation-permits`（收费闸门，返回 allowedResources：promptBundle / styleDocument）
3. 取提示词：`/api/prompts/resolve`（内存使用，不落盘）
4. 驱动本地 agent：`runtime-paths.json` 记录 codex 路径（本机为 `~/.npm-global/bin/codex`）；提示词写入临时目录 `histyle-codex-home-*`，工作区 `histyle-codex-workspace-*`（均在本机 $TMPDIR，退出即删）
5. 产出两版：preview（预览版）→ wechat（微信合规版，juice 内联 + 组件边界纠正）
6. 导出：长图（截图）/ 网页（inline HTML，复制进公众号编辑器）

## 本地可读的（已归档）

| 内容 | 位置 |
| --- | --- |
| 风格库元数据 77 套 | 本地 sqlite `app_settings.cached_style_library`（副本在 raw/style-library.json） |
| 每套风格样章 HTML ×3（标准/灵动/轻盈）+ 缩略图 + 预览视频 | `~/Library/Application Support/HISTYLE/style-assets/`（副本在 raw/style-assets/，99MB） |
| 用户文章的生成成品（预览版 + 合规版 inline HTML） | sqlite `project_versions.inline_html` |
| 生成元数据（模型 deepseek-flash / deepseek-v4-pro、风格、耗时） | sqlite `ai_runs` |
| 主进程代码 | app.asar 解包（依赖：cheerio、css-tree、juice、mammoth、turndown、undici） |

## 本地读不到的

- promptBundle（编排提示词）、styleDocument（风格说明文档）：服务器按次下发，本地库 prompt 字段为空、HTTP 缓存为空
- 唯一明文窗口：HiStyle 运行期间，`$TMPDIR/histyle-codex-home-*` 内的提示词/AGENTS 指令文件（由 tools/watch-runtime.mjs 自动截获）

## API 端点清单（主进程代码提取）

账户与收费：`/api/account`、`/api/account/generation-permits`、`/api/auth/*`
生成核心：`/api/prompts/resolve`、`/api/client/runtime-integrity`、`/api/events/stream`
风格与素材：`/api/styles`、`/api/styles/assets/`
样本采集：`/api/samples/*`（collection-policy / submit / placeholders——注意它可能收集生成样本）
其他：`/api/uploads/*`、`/api/shares`、`/api/feedback`、`/api/updates/*`、`/api/tips`、`/api/analytics/*`

## 对自研引擎的启示

1. 收费模式 = 生成许可闸（permit）+ 服务器持有提示词/风格文档。技术全在客户端，资产全在服务器。
2. 它的风格 = 样章 HTML（few-shot 参考）+ 风格文档，由 agent 自由发挥生成版式——这就是「每次生成版式都不同」的原因，也是它好看的来源（生成式）与不稳的来源。
3. 我们的差异化路线：风格 = 可复刻骨架库（确定性渲染，所见即所得）+ 可选生成式装饰层。复刻任意公众号链接是它没有的能力。

## 运行时模式（2026-09-21 运行时截获补全）

主进程代码确认 4 种运行时：`claude` / `codex` / `chatgpt`（三种 local-cli 本地 agent 模式）/ `api-key`（服务器中转模式）。

- **api-key 模式**（用户当前配置）：本地无 agent 进程。生成时只见 `device-proof-helper sign`（对 `POST /api/prompts/resolve` 做设备证明签名），随后由 histyle.top 服务器拿用户配置的 key（api.deepseek.com）中继完成生成。提示词全程不落本地磁盘。ai_runs.runtime_id='api-key'。
- **codex/claude 模式**：本地拉起 agent CLI，提示词写入 `$TMPDIR/histyle-codex-home-*`（用完即删，仅在生成窗口内可读）。
- 证据：两次生成窗口内全量进程 diff 无任何 agent 子进程；device-proof-helper 签名内容含 `/api/prompts/resolve`。

### 对自研产品的启示

1. 「烧用户自己的 key」有两种实现：本地 agent（重，体验依赖用户环境）vs 服务器中继（轻，但服务器能看用量甚至内容——信任问题）。
2. 收费闸门 = generation-permit + device-proof（设备证明），客户端只负责签名与记账。

## 运行时截获：五条路线的战果（2026-09-21 收兵）

目标：api-key 模式下截获 `/api/prompts/resolve` 的提示词响应。**未达成**，五条路线全部失败，记录备查：

| 路线 | 失败原因 |
| --- | --- |
| 临时目录截获 | api-key 模式无本地 agent，提示词不过本地磁盘（codex/claude 本地模式才有临时目录） |
| 进程树间谍 v2-v4 | 生成期间无任何本地 agent 子进程；全量进程 diff 证实计算在服务器 |
| CDP 调试端口 | 应用过滤 `--remote-debugging-port`，注入即拒绝启动 |
| 代理环境变量 + mitmproxy | 主进程 API 走 undici（Node 底层），不吃系统/环境代理 |
| asar 补丁注入 | 撞 ElectronAsarIntegrity 完整性校验；哈希算法未破解即收兵 |

关键情报（对自研有参考价值）：
1. **Electron Fuse** 禁用了 NODE_OPTIONS，预载脚本注入无门。
2. **asar 完整性校验** = Info.plist 里 ElectronAsarIntegrity 的 SHA256，与文件 sha256 不同（按头部区域计算，具体算法未还原）。
3. macOS 系统保护禁止修改 /Applications 下已签名 app 的包内容（Operation not permitted），必须复制副本修改。
4. `device-proof-helper` 对 `/api/prompts/resolve` 请求做设备证明签名（防重放/防模拟客户端）。
5. api-key 模式 = 服务器中继用户 key 调 LLM，本地只见元数据；内容隐私性弱于本地 agent 模式。

结论：提示词不可得也不必要——开源版提示词自研，合规规则用本地成品 diff 反推（preview vs wechat 两版 inline_html 均在 sqlite）。
