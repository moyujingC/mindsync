# 排版工坊（内部版）

> 状态：current
> 版本：0.1.1
> owner：CEO
> last_updated：2026-09-25
> source_of_truth：projects/content-matrix/排版工坊/PROJECT.md

## 是什么

公众号/小红书排版与出图工具的**内部版**工作区。两件事：

1. **扒 HiStyle**：逆向其架构与资产，把复刻所需的原料全部本地化（raw/ 不入 git）。
2. **长出自己的工具**：基于拆解结论自研排版引擎，未来开源（开源仓另建，自研风格才进开源仓）。

## 目录

- `teardown/` — HiStyle 拆解档案（架构、API、数据库结构），入 git
- `styles/` — 复刻出的风格骨架库（我们自己的提取产物），入 git
- `tools/` — 工具脚本（showcase 预处理、运行时看守等），入 git
- `raw/` — HiStyle 原始缓存副本（99MB 风格样章，版权资产，仅本地，不入 git）
- `runtime-capture/` — 运行时截获（提示词、会话日志），不入 git

## 边界

- raw/ 与 runtime-capture/ 是 HiStyle 的版权资产，只作个人参考，**任何文件不得进入开源仓库或对外发布**
- 开源版的代码、提示词、风格全部自研；HiStyle 只作需求参照和审美基准
- 排版链路的出口标准不变：公众号成品 HTML 可粘贴/直发草稿箱

## 当前进度

- [x] HiStyle 静态资产全量归档（77 风格 × 3 版本样章）
- [x] 架构拆解（见 teardown/HiStyle-架构拆解.md）
- [x] 运行时截获看守工具（tools/watch-runtime.mjs）
- [x] 运行时截获：已收兵（api-key 模式无本地落点，五路线失败记录见 teardown）
- [x] 选定 1-2 套风格做复刻终验（CEO 拍板 2026-09-25：**011·暗房放映·奶油巨字 的轻盈版**（--mode light，样章 b8b3ee88 showcase-new-1）；跑法：node bin/typeset.mjs <成稿.md> --style 011 --mode light）
- [ ] 合规规则反推：preview vs wechat 成品 diff 分析（原料在本地 sqlite）
- [ ] 自研排版引擎 M1（CLI：md → 公众号 HTML，风格库驱动）
