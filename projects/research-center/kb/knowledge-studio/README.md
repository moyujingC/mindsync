# 知识工坊

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-10
> source_of_truth：projects/research-center/kb/knowledge-studio/README.md

`知识工坊` 是研究中心下的公司知识库工作台。

它不是 `company/knowledge-base` 的替代品，也不是原始笔记区。它负责把可追溯的 Source（来源）加工成 atoms（原子知识），再编译成 wiki（结构化知识）。成熟、跨项目、跨角色复用的结论，后续再晋升到公司级知识库。

## 核心流程

```text
sources -> atoms -> wiki
```

- `sources`
  - 来源层，保存或登记可追溯材料。
- `atoms`
  - 原子知识层，把来源中的内容拆成一条条可检查、可复用的最小判断。
- `wiki`
  - 结构化知识层，把多个 atoms 组织成当前确认后的系统化理解。

第一版不创建 `outputs/`。自媒体、课程和项目应用输出，仍由内容矩阵或具体项目承接。

## 主题范围

### AI

AI 主题的来源包括：

- 大 V 文章、博客、长文、推文；
- YouTube 或其他视频分享，优先使用转写稿；
- GitHub 仓库、README、issue、PR；
- 自己项目中的 commit、文档、任务记录和工程实践。

AI 主题的 wiki 应优先沉淀：

- 学习后形成的个人理解；
- 已经或准备应用到项目中的方法；
- Agent、工具、上下文、评测、护栏等工程判断；
- 可转化为自媒体内容的结构化观点。

### 心理疗愈

心理疗愈主题的来源包括：

- PDF 转 Markdown 后的书籍；
- 论文；
- 课程材料；
- 经确认的个人学习记录。

心理疗愈主题默认更严格，必须区分：

- 书中观点；
- 个人理解；
- 个人体验；
- 可尝试的练习方法；
- 不适用边界和风险提示。

不要把书中观点、AI 解释或个人体验直接写成普适事实。

## 目录结构

```text
knowledge-studio/
  sources/
    ai/
    healing/
  atoms/
    ai/
    healing/
  wiki/
    ai/
    healing/
  templates/
```

## 晋升规则

只有满足以下条件的 wiki 结论，才适合后续提炼到 `company/knowledge-base`：

1. 有明确 source 或 atom 支撑；
2. 已经人工确认；
3. 具备跨项目或跨角色复用价值；
4. 边界清楚；
5. 不是单次任务、单次聊天或单一项目的临时判断。
