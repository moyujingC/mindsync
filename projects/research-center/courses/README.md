# AI 课程学习资料

> 状态：current
> 版本：0.2.0
> owner：CEO
> last_updated：2026-08-26
> source_of_truth：projects/research-center/courses/README.md

这里集中保存正在学习的 AI 课程及其章节材料。每门课程独立一个目录，课程原文按章节单独存放；个人随手批注和后续摘录保留在对应章节文件内。

课程材料属于可追溯的学习来源，不等同于研究中心已经确认的结论；课程作者的案例、数据和观点应保留其来源属性。

## 课程索引

状态仅描述本地材料的收录情况：`已完结` 表示目录中已收录结束语或结课测试；`连载中` 表示尚未收录课程结束语，不代表平台一定仍在更新；`待开营` 表示当前仅收录课程说明或排期，尚未进入正式授课期。

| 状态 | 课程 | 主题 | 本地已收录 |
| --- | --- | --- | --- |
| 已完结 | [AI 原生开发工作流实战](./2025-11-18-AI%20原生开发工作流实战/) | AI 原生开发、Agent（智能体）工作流 | 28 篇 |
| 已完结 | [Claude Code 企业级全链路开发实战](./2026-04-01-Claude%20Code%20企业级全链路开发实战/) | Claude Code、规范驱动开发、工程交付 | 36 篇 |
| 已完结 | [从 0 开始构建 Agent Harness](./2026-04-19-从%200%20开始构建%20Agent%20Harness/) | Agent Harness（智能体脚手架）、评估与运维 | 25 篇 |
| 已完结 | [Claude Code 企业级老项目改造实战](./2026-05-07-Claude%20Code%20企业级老项目改造实战/) | 老项目改造、开源贡献 | 36 篇 |
| 已完结 | [Java Agent：从 Demo 到生产级实践](./2026-05-18-Java%20Agent：从%20Demo%20到生产级实践/) | Java Agent、企业级工程化 | 17 篇 |
| 已完结 | [AGI 产品经理全栈进化指南](./2026-06-12-AGI产品经理全栈进化指南/) | AI 产品、需求验证、部署上线 | 23 篇 |
| 已完结 | [小哲电商 Agent](./小哲电商Agent/) | 电商客服 Agent、RAG（检索增强生成）、工具调用、工作流与生产治理 | 96 篇课程与配套材料 |
| 连载中 | [AI 时代的本体论前沿入门课](./2026-06-08-AI时代的本体论前沿入门课/) | Web 语义本体、知识图谱、Palantir Ontology（本体模型） | 3 篇转写稿 + 配套 PDF |
| 连载中 | [Codex 与 LLM 量化交易实战课](./2026-07-19-Codex%20与%20LLM%20量化交易实战课/) | LLM 量化研究、数据证据与风险边界 | 15 篇 |
| 连载中 | [Agent 设计模式之美](./2026-05-26-Agent%20设计模式之美/) | Agent 设计模式、上下文、记忆与执行 | 26 篇 |
| 连载中 | [Harness Agent 脚手架实战课](./2026-07-03-Harness%20Agent%20脚手架实战课/) | Agent 脚手架、金融投研、可观测性 | 16 篇 |
| 连载中 | [AI Agent 系统设计面试现场](./2026-07-10-AI%20Agent%20系统设计面试现场/) | Agent 系统设计、面试表达 | 15 篇 |
| 连载中 | [FDE 业务落地实战](./2026-07-28-FDE业务落地实战/) | 企业 AI 落地、FDE（Forward Deployed Engineer，前向部署工程师）交付 | 5 篇 |
| 连载中 | [生产级 Agent 排雷实战](./2026-08-04-生产级%20Agent%20排雷实战/) | Agent 生产部署、工具调用与执行控制 | 3 篇 |
| 连载中 | [OPC 一人公司创业实战课](./2026-03-26-OPC%20一人公司创业实战课/) | 一人公司创业 | 17 篇 |
| 待开营 | [Codex AI 工程交付行动营](./2026-08-17-Codex%20AI%20工程交付行动营/) | Codex、AI 工程交付、任务实践 | 3 篇说明；计划 16 节录播 + 3 次直播 |
| 连载中 | [Agent 驾驭工程之美](./2026-08-18-Agent%20驾驭工程之美/) | Harness、Agent 操控循环、Skill（技能）封装 | 5 / 35 讲 |
| 连载中 | [2026 年企业级 AI 编程实战营](./2026年企业级AI编程实战营/) | SDD（规格驱动开发）、Harness、Agent OS、工程协作与实现 | 110 份课程材料 |
| 连载中 | [AI 业务流架构师训练营](./AI业务流架构师训练营/) | OpenClaw、业务流自动化、Skill、记忆、模型路由与跨系统集成 | 110 份课程材料 |
| 连载中 | [HA7CH AI Native School](./HA7CH-AI-Native-School/) | AI Native、FDE（Forward Deployed Engineer，前线部署工程）、GitHub 协作与一号位沟通 | 上游 GitHub 仓库（Git 子模块） |

已完结课程后续如出现平台加餐或补充内容，仍可继续收录到原目录；状态变更时一并更新本表。

`2026-08-25-DeepSeek Harness 前沿工程实践/` 已建立为课程目录，当前尚未收录文件，因此暂不进入课程索引；首次收录材料时补充课程状态、主题和数量。

### 外部课程仓库的更新

`HA7CH-AI-Native-School/` 是上游 `https://github.com/HA7CH/ha7ch-school` 的 Git 子模块，当前跟踪 `master`。更新到上游最新版本：

```bash
git -C projects/research-center/courses/HA7CH-AI-Native-School fetch origin master
git -C projects/research-center/courses/HA7CH-AI-Native-School checkout master
git -C projects/research-center/courses/HA7CH-AI-Native-School pull --ff-only origin master
git add projects/research-center/courses/HA7CH-AI-Native-School
git commit -m "chore(courses): update HA7CH school"
```

父仓库只记录子模块提交指针；更新后需提交父仓库，其他工作区再运行 `git submodule update --init --recursive` 获取相同版本。

## 单门课程的默认结构

```text
courses/
  课程名/
    00｜章节标题-课程名-平台.md
    01｜章节标题-课程名-平台.md
    配套课件.pdf           # 可选：原始讲义或课件，保留原文件
    课程信息.md           # 可选：讲师、平台、链接、学习进度、版权备注
```

课程开始学习时，直接按章节创建对应的 Markdown 文件；无需预先创建未发布或未收录的章节。视频课的录音转文字稿应保留为章节原文，不把识别结果改写成课程事实；有配套讲义或课件时，保留 PDF 原文件，并在 `课程信息.md` 标明其来源和用途。

使用 Obsidian 转存插件导入后，删除正文前的课程页 UI（学习人数、课程目录、时长、播放控件等）。保留从 `<audio>` 或 `<video>` 标签开始的内容；没有媒体标签时，从第一个正文段落或标题开始保留。

## 课程内容如何流转

```text
课程章节原文与个人批注
  -> 课程内个人理解或待验证问题
  -> research/（需要围绕问题做正式研究）
  -> kb/sources/ai/（需要作为可追溯来源处理）
  -> kb/atoms/ai/ 和 kb/wiki/ai/（有证据、经过确认的可复用知识）
  -> 具体业务项目（明确的产品、内容或交付行动）
```

- 不因内容出自课程而直接进入 `kb/`；先保留作者观点、证据和适用边界。
- 已有同主题 wiki 时，优先将课程当作补充来源链接进去，不重复建立平行结论。例如 FDE 课程可补充到 `kb/wiki/ai/企业AI落地与FDE.md` 的来源层。
- 课程带来的行动想法，应进入对应项目的 `tasks/`、`specs/` 或 `delivery/`，不写回课程原文。
- 课程笔记中的个人批注请以 `> 我的笔记：` 标识，避免与课程原文混淆。
