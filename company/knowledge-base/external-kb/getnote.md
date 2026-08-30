---
schema: agentcompanies/v1
kind: knowledge-base
type: external-kb
name: Get笔记
alias: 得到大脑
status: current
version: 0.1.0
owner: Research & Knowledge Lead
last_updated: 2026-08-30
source_of_truth: company/knowledge-base/external-kb/getnote.md
skill_path: shared/skills/getnote
claude_skill_path: ~/.claude/skills/getnote
---

# Get笔记（得到大脑）接入方案

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-08-30
> source_of_truth：company/knowledge-base/external-kb/getnote.md

## 1. 它是什么

`Get笔记` 是一款外部笔记与知识库服务，官网为 [https://biji.com](https://biji.com)。在内部口语中，它也被称作**得到大脑**。

它支持：

- 保存文本、链接、图片、语音笔记
- 通过语义搜索召回历史笔记
- 用知识库和标签组织笔记
- 通过开放平台 API 进行读写

## 2. 当前接入形态

`MindSync` 通过以下两层与 `Get笔记` 交互：

| 层级 | 位置 | 职责 |
|------|------|------|
| Claude Code Skill | `~/.claude/skills/getnote`（桥接自 `shared/skills/getnote`） | 在 IDE 内提供 `/note save`、`/note search` 等自然语言指令 |
| 共享脚本 | `shared/tools/import-*-to-getnote.py`、`shared/tools/getnote-setup.sh` | 批量导入本地视频、社媒链接等内容到 Get笔记 |

`shared/skills/getnote/SKILL.md` 是 Skill 的正式入口，包含完整 API 路由、认证方式、错误处理和自然语言路由表。

## 3. 已具备的能力

### 3.1 通过 Skill 直接读写

在 Claude Code 中，Agent 可直接调用 Get笔记 Skill：

- **保存**：文本、链接、图片
- **搜索**：全局语义搜索、指定知识库语义搜索
- **列表与详情**：分页浏览、查看笔记详情
- **更新与删除**：修改笔记内容、删除笔记
- **知识库管理**：创建知识库、添加/移除笔记、订阅博主/直播
- **标签管理**：添加/删除标签

### 3.2 通过脚本批量导入

仓库内已有脚本用于特定批量场景：

- `shared/tools/import-local-videos-to-getnote.py`
- `shared/tools/import-social-links-to-getnote.py`
- `shared/tools/import-xiaohongshu-2026-to-getnote.py`
- `shared/tools/sync-courses-to-getnote.py` — 将 `projects/research-center/courses/` 中的 Markdown 课程内容同步到 Get笔记，每个课程一个知识库，每个 Markdown 文件一条笔记
- `shared/tools/getnote-setup.sh`

这些脚本属于**项目/任务级工具**，不在本方案中展开；需要使用时直接阅读脚本头部注释或 `--help`。

## 4. 配置方式

### 4.1 环境变量

Skill 运行时依赖以下环境变量：

| 变量 | 是否必填 | 说明 |
|------|----------|------|
| `GETNOTE_API_KEY` | 是 | 格式 `gk_live_xxx` |
| `GETNOTE_CLIENT_ID` | 是 | 格式 `cli_xxx` |
| `GETNOTE_OWNER_ID` | 否 | 配置后限制只有指定用户可操作笔记 |

### 4.2 获取凭证

1. 访问 [Get笔记开放平台](https://www.biji.com/openapi)
2. 开通会员后创建应用，获取 API Key 与 Client ID
3. 将凭证配置到 Claude Code 可读取的环境变量中

### 4.3 权限 Scope

- `note.content.read`：读取笔记
- `note.content.write`：写入笔记
- `note.recall.read`：语义搜索

完整 Scope 与错误码见 `shared/skills/getnote/references/api-details.md`。

## 5. 重要技术约束

### 5.1 笔记 ID 精度

笔记 ID 是 **64 位整数**，超出 JavaScript `Number.MAX_SAFE_INTEGER`。在 Node.js 环境中解析 JSON 时必须先把 ID 字段转为字符串，否则会出现静默精度丢失。

Python、Go 等语言原生支持大整数，无此问题。

### 5.2 会员限制

部分 API（尤其是写入和搜索）需要开通 Get笔记会员。遇到错误码 `10201` 或 `reason: not_member` 时，应引导开通会员：

```
https://www.biji.com/checkout?product_alias=6AydVpYeKl
```

### 5.3 限流

- 创建笔记建议间隔 1 分钟以上
- 遇到错误码 `10202` 时，按响应中的 `rate_limit` 字段降频重试

### 5.4 隐私

- 笔记数据属于用户隐私
- 配置了 `GETNOTE_OWNER_ID` 时，必须校验 sender_id，不匹配则拒绝操作
- 不在群聊等公开场合主动展示笔记内容

## 6. 与 `MindSync` 的协同边界

### 6.1 什么场景直接用 Get笔记 Skill

- 随手记录灵感、链接、图片
- 需要语义搜索召回个人笔记
- 快速把外部内容暂存到第二大脑

### 6.2 什么场景需要同步到 `mindsync` 仓库

- 笔记内容需要进入项目知识库长期维护
- 需要与项目 spec、task、qa 形成引用关系
- 需要版本控制、代码审阅或多人协作

### 6.3 课程资料同步

`shared/tools/sync-courses-to-getnote.py` 会把 `projects/research-center/courses/` 中的 Markdown 课程内容同步到 Get笔记：

- 所有课程共享一个知识库：`研究中心课程目录`
- 每门课程在知识库中创建一个父笔记，相当于课程文件夹
- 每个 Markdown 章节作为子笔记挂到对应课程的父笔记下
- 只同步 Markdown 文件，跳过 PDF、视频、`.sz`、代码等二进制内容
- 增量同步：基于文件 sha256 + mtime，已同步的文件不会重复创建
- 标签统一为 `研究中心`、`课程`

运行方式：

```bash
# 只发现文件，不调用 API
python3 shared/tools/sync-courses-to-getnote.py --dry-run

# 同步单个课程（最多 5 条笔记）
python3 shared/tools/sync-courses-to-getnote.py --course "2026-07-28-FDE业务落地实战" --max-notes 5

# 同步全部课程
python3 shared/tools/sync-courses-to-getnote.py
```

环境变量要求：`GETNOTE_API_KEY`、`GETNOTE_CLIENT_ID`。

### 6.4 当前未完全解决的问题

- **课程资料同步的运行方式**：当前为手动触发脚本；如需要定时运行，可配置 launchd 或 GitHub Actions 定时触发。
- **双向同步**：尚未建立 Get笔记 ↔ `mindsync` 的自动双向同步机制。
- **内容路由**：从 Get笔记同步到 `projects/<slug>/kb/` 时，需要按主题/项目分类的规则。
- **去重与更新**：已变化文件目前不会自动更新，只同步新增文件。

这些问题将在后续专项任务中逐步解决，不在本方案中一次性落地。

## 7. 使用入口

- Skill 实现：`shared/skills/getnote/`
- Claude Code 桥接：`~/.claude/skills/getnote`
- 共享脚本：`shared/tools/import-*-to-getnote.py`、`shared/tools/getnote-setup.sh`
- 外挂知识库注册表：[README.md](README.md)

## 8. 变更同步规则

- Skill 版本升级时，同步更新本方案的「已具备能力」和「技术约束」
- 新增批量导入脚本时，在「共享脚本」中补充入口
- 落地双向同步或内容路由方案后，将对应结论迁入本方案
