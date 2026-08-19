> 状态：reference
> 版本：0.1.0
> source_of_truth：自动补齐

# 心理疗愈 App 正式研究稿与归档文档整合映射表

> 日期：2026-06-07  
> 用途：回答“按产品归档里的文档内容，是否已经整合进现在的研究报告”。  
> 口径：这份表只说明“整合状态”和“整合方式”，不等于每篇归档文档都已经被逐字复核。  

## 1. 先说结论

有整合，但目前是 **分层整合**，不是“45 篇全部都已经重写成正式研究稿”。

当前可以分成三层：

1. **已形成正式研究稿**
   目前有 3 个重点样本：
   - Ash / Slingshot AI
   - Rosebud
   - Rocky.ai

2. **已进入总览层，但还没形成正式研究稿**
   例如：
   - Noah AI
   - Sonia AI
   - Flourish Science / Sunnie
   - Pi / Inflection AI
   - Yuna Health
   - CoachHub AIMY
   - Eleos Health
   - 以及其它长尾样本

3. **仅完成归档，尚未系统重写**
   这部分仍主要停留在 `按产品归档/` 目录中，供后续继续核验与提炼。

一句话：

**归档目录已经是研究输入层；总览文档是产品级汇总层；正式研究稿目前只覆盖 3 个重点样本。**

## 2. 整合原则

归档文档进入正式研究稿时，按下面的规则处理：

1. 先把归档文档当作线索库和底稿。
2. 多篇旧稿都在重复出现、且彼此不明显冲突的内容，优先吸收为产品理解框架。
3. 技术架构、隐私、安全、合规、融资、用户规模、临床效果这类高风险内容，不直接沿用旧稿，而是尽量再看官网、帮助中心、隐私政策、条款和可信报道。
4. 旧稿中明显带推测色彩的内容，会被降级成：
   - 创业判断
   - 技术推断
   - 待核验问题
5. 不能被公开资料支撑的内容，不会写成“已核验事实”。

## 3. 当前整合状态总表

| 产品 | 归档文档数 | 当前整合状态 | 已进入哪些输出 |
| --- | ---: | --- | --- |
| Ash / Slingshot AI | 9 | 高 | 总览 + 正式研究稿 |
| Noah AI | 6 | 中 | 总览 |
| Rosebud AI | 5 | 高 | 总览 + 正式研究稿 |
| Rocky.ai | 5 | 高 | 总览 + 正式研究稿 |
| Sonia AI | 4 | 中 | 总览 |
| Flourish Science / Sunnie | 3 | 中 | 总览 |
| Pi / Inflection AI | 2 | 中 | 总览 |
| Yuna Health | 2 | 中 | 总览 |
| InfiHeal / Healo | 1 | 低到中 | 总览 |
| CoachHub AIMY | 1 | 中 | 总览 |
| Purpose | 1 | 低到中 | 总览 |
| MoodTalker / 林间聊愈室 | 1 | 低 | 总览 |
| Layers | 1 | 低到中 | 总览 |
| Betwixt | 1 | 低到中 | 总览 |
| Eleos Health | 1 | 中 | 总览 |
| 星云星空 | 1 | 低 | 总览 |
| therappai | 1 | 低 | 总览 |

说明：

- `高`：已被系统重写为正式研究稿，且明确区分“已核验事实 / 创业判断 / 待核验问题”。
- `中`：已被吸收进总览判断，但还没有形成单独正式稿。
- `低`：当前仍主要停留在归档层，只有少量在总览中被概括引用。

## 4. 已形成正式研究稿的详细映射

下面这部分只覆盖已经进入正式研究稿的 3 个重点样本。

### 4.1 Ash / Slingshot AI

正式研究稿：

- [01_Ash_Slingshot_AI_正式研究文档.md](/Users/xinran/Downloads/dev/mindsync/projects/research-center/research/心理疗愈app/重点样本正式研究/01_Ash_Slingshot_AI_正式研究文档.md)

归档来源目录：

- [01_Ash_Slingshot_AI](/Users/xinran/Downloads/dev/mindsync/projects/research-center/research/心理疗愈app/按产品归档/01_Ash_Slingshot_AI)

已整合的归档文件：

- `AI 心理疗愈_教练技术产品拆解报告：Ash (by Slingshot AI).md`
- `AI心理疗愈应用分析：Ash by Slingshot AI.md`
- `AI心理疗愈应用拆解_Ash.md`
- `Ash AI (by Slingshot AI) - Product Analysis.md`
- `Ash_AI_Analysis_Report.md`
- `ash_ai_analysis_report 2.md`
- `ash_ai_report_v2.md`
- `ash_ai_teardown_report.md`
- `今日 AI 应用分享：Ash AI —— 首款专为心理疗愈设计的垂直领域大模型应用.md`

主要吸收了什么：

- 它是心理支持而不是普通通用陪聊
- 它强调长期关系与跨对话模式识别
- 它在产品叙事上明显靠近 therapy 语义
- 它适合作为“高关系强度 + 高安全责任 + 垂直模型叙事”的研究样本

哪些内容被重写或降级了：

- 具体底层模型、RAG、向量数据库、云架构等技术细节没有直接沿用旧稿
- 未被官方明确支持的疗效、训练规模和“护城河”判断没有写成事实
- 安全与隐私部分主要改用官网、隐私政策、EULA 和安全研究重新收束

当前判断：

**Ash 的归档内容已经较充分地进入正式研究稿，但进入方式是“吸收主干判断 + 官方二次核验 + 重写结构”，不是旧稿拼接。**

### 4.2 Rosebud

正式研究稿：

- [02_Rosebud_正式研究文档.md](/Users/xinran/Downloads/dev/mindsync/projects/research-center/research/心理疗愈app/重点样本正式研究/02_Rosebud_正式研究文档.md)

归档来源目录：

- [03_Rosebud_AI](/Users/xinran/Downloads/dev/mindsync/projects/research-center/research/心理疗愈app/按产品归档/03_Rosebud_AI)

已整合的归档文件：

- `Rosebud AI 产品深度拆解报告.md`
- `Rosebud_AI_Deep_Dive.md`
- `Rosebud_AI_Product_Breakdown.md`
- `Rosebud_Product_Analysis.md`
- `rosebud_analysis.md`

主要吸收了什么：

- Rosebud 的核心是 `AI journaling（日记） + pattern recognition（模式识别） + personalized reflection（个性化反思）`
- 它不是治疗承诺型产品，而是个人成长和自我反思型产品
- 长期记忆、持续性和周报式洞察是它的重要产品价值
- 它适合作为“自我记录型 AI 产品”的重点样本

哪些内容被重写或降级了：

- 旧稿里常见的 `GPT-4 / GPT-4o / Pinecone / React Native / HIPAA 认证 / 端到端加密` 等说法，没有直接进入正式稿
- 技术实现被重新收束为“可确认结构件 + 更可能的系统路径 + 不应写成事实的部分”
- 安全与隐私部分主要改用帮助中心、隐私政策和可信报道重写

当前判断：

**Rosebud 的归档内容已经进入正式研究稿，尤其是产品定位、用户价值和长期记忆判断；但具体技术栈与安全成熟度，已经按更谨慎口径重写。**

### 4.3 Rocky.ai

正式研究稿：

- [03_Rocky_ai_正式研究文档.md](/Users/xinran/Downloads/dev/mindsync/projects/research-center/research/心理疗愈app/重点样本正式研究/03_Rocky_ai_正式研究文档.md)

归档来源目录：

- [04_Rocky_ai](/Users/xinran/Downloads/dev/mindsync/projects/research-center/research/心理疗愈app/按产品归档/04_Rocky_ai)

已整合的归档文件：

- `AI 应用深度拆解报告：Rocky.ai.md`
- `AI_Psychological_Coaching_App_Analysis.md`
- `Rocky_AI_Deep_Dive.md`
- `product_teardown_report.md`
- `rocky_ai_research.md`

主要吸收了什么：

- 它不是消费端疗愈产品，而是企业级 AI 教练平台
- 白标、知识接入、角色扮演和组织方法论产品化是其主线
- 它适合作为“平台型 / B2B / 教练工作流型 AI 产品”的重点样本
- 它的研究价值在于 `RAG + 多智能体 + 配置化平台` 这条路线

哪些内容被重写或降级了：

- 归档文档里若存在过度技术化、工程框架级猜测，没有直接写入正式稿
- 正式稿只保留公开资料能支持的 `COE / AMGS / RAG / modular AI agents / Google Cloud / 外部 LLM 微服务`
- 没有把任何临床级能力、正式认证或高敏感用途写成已成立事实

当前判断：

**Rocky.ai 的归档内容已经进入正式研究稿，但重点从“产品功能介绍”被提升成了“平台架构和商业模式研究”。**

## 5. 已进入总览、但还没进入正式研究稿的产品

下面这些产品已经不是“完全没用到”，而是：

- 已被总览文档概括吸收
- 已被用来支持赛道判断
- 但还没有展开成单独的正式研究稿

代表包括：

- Noah AI
- Sonia AI
- Flourish Science / Sunnie
- Pi / Inflection AI
- Yuna Health
- CoachHub AIMY
- Eleos Health
- InfiHeal / Healo
- Purpose
- Layers
- Betwixt

这些产品目前主要被用于：

1. 支撑 7 个赛道与产品模式判断  
2. 丰富“消费端 / 自我记录型 / B2B 教练型 / 临床工作流型”对比  
3. 提供后续优先研究名单  

换句话说：

**它们已经进入研究结论，但还没有进入“正式研究稿层”。**

## 6. 目前还没有做到的事

为了避免误判，这里明确列出还没完成的部分：

1. 还没有给全部 17 个产品分别写正式研究稿。  
2. 还没有逐篇文档做“句子级溯源表”。  
3. 还没有把每个归档目录里的每一句说法都做外部二次核验。  
4. 还没有完成 `Eleos Health` 的正式研究稿。  

所以当前最准确的说法是：

**归档文档已经系统进入研究流程，但只有 3 个重点样本完成了正式稿级别的整合。**

## 7. 建议下一步

如果要把这件事做得更扎实，建议按下面顺序继续：

1. 先补 [04_Eleos_Health_正式研究文档] 这一篇，完成 4 个重点样本闭环。  
2. 再做一份“17 个产品整合状态看板”，给每个产品标：
   - 是否有官网核验
   - 是否进入总览
   - 是否进入正式稿
   - 当前置信度
3. 再挑 3 到 5 个非重点样本，按同一模板继续扩写。  

这样后面不管是自己学习，还是再同步到网站，都会更稳。
