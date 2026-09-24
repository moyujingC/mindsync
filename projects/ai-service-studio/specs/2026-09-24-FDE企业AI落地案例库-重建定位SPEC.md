# FDE 企业 AI 落地案例库：重建定位 SPEC

> 状态：draft
> 版本：0.1.0
> owner：CEO
> last_updated：2026-09-24
> source_of_truth：projects/ai-service-studio/specs/2026-09-24-FDE企业AI落地案例库-重建定位SPEC.md
> 项目：墨予镜企业AI服务
> 阶段：spec
> 任务级别：新产品线（开源案例库 + 模式库）
> depends_on：references/FDE-case-library（上游基线，MIT，子模块引入）
> reviewers：CEO

## 1. 问题与定位

GitHub 上已有企业 AI 落地案例库（guminghao-avi/FDE-case-library，127 条，MIT），组织方式是「按公司/行业陈列事实」。2026-09-24 盘点同类项目后确认空位：中文 + 结构化可筛选 + 证据分级 + 面向业务痛点的检索 + 交付模式拆解，这个位置没人占。

本项目重建该案例库，切入角度为已确认的合并定位：

- **角度一（企业决策者）**：按「业务痛点」组织案例，每条案例翻译成决策语言——投入、周期、前提条件、失败点、同类企业能否复制。服务对象是中小企业老板和业务负责人，即墨予镜 FDE 服务的潜在客户。
- **角度二（交付者）**：从案例中抽象出「FDE 模式库」——诊断套路、窄场景选择、人机责任划分、评测与上线方法。案例是模式的佐证材料。服务对象是 FDE/AI 落地从业者，同时沉淀墨予镜自己的交付方法论。

对墨予镜的商业价值：案例库是获客资产（老板按痛点检索后自然进入诊断服务），模式库是服务资产（喂给 ai-service-studio 的 SOP 与报价实验）。

## 2. 与上游基线的关系

- 上游 127 条数据按 MIT 协议复用，保留署名与来源链接。
- 组织、分析框架、页面全部自建，不 fork 上游仓库。
- 删减标准：砍掉 15 条概览级（证据弱、无细节）；77 条标准级按痛点相关性与证据等级复核后决定去留；35 条深度级全保留并补充新字段。
- 新增案例来源：themanojdesai/genai-llm-ml-case-studies（MIT，500+ 条中挑选深度素材重新提取）、global-fde/awesome-fde-resources 作为一手来源线索池。无协议项目只当线索不抄内容。

## 3. 数据结构

### 3.1 案例（cases.json）

继承上游字段中仍有效的部分（company / industry / problem / solution / human / result / evidence_level / url 等），废弃与旧展示逻辑绑定的字段。新增：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| pain_points | string[] | 业务痛点标签，检索主维度。标签集单独维护（见 3.3） |
| decision_info | object | 决策语言：effort（投入量级）/ duration（周期）/ prerequisites（前提条件）/ failure_modes（失败点）/ transferability（同类企业可复制性：高/中/低 + 一句话理由） |
| delivery_pattern | string | 交付模式：诊断型 / 平台型 / 助手型 / 评测型，单选 |
| pattern_links | string[] | 关联的模式 ID（见 3.2） |
| fde_actions | string[] | 保留上游字段，模式抽象的原始材料 |
| interview_usable | — | 不做。已确认不从面试角度切入 |

effect 类数字沿用上游证据口径：区分「公开事实」与「来源方披露」，不做独立审计暗示。

### 3.2 模式（patterns.json）

独立数据文件，是角度二的核心产物：

| 字段 | 说明 |
| --- | --- |
| id / name / summary | 模式标识与一句话定义 |
| signals | 适用信号：什么情况下该考虑这个模式 |
| actions | 关键动作序列 |
| anti_patterns | 反模式：什么情况下这个模式会失败 |
| case_refs | 佐证案例 ID 列表（≥2 条才允许立模式） |

模式从案例的 fde_actions 高频项统计抽象产生，不是编辑拍脑袋。首版规模 8-12 个模式。

### 3.3 痛点标签集（pain-points.json）

独立维护的受控词表，首版从 127 条案例的 problem 字段聚类产生，预计 15-25 个标签（如：客服成本 / 文档审核 / 专家知识流失 / 遗留系统维护 / 质检依赖人工 等）。标签集本身也对外公开，接受 issue 投稿修订。

## 4. 页面形态

零依赖静态站（无构建步骤），GitHub Pages 部署：

- 首页：痛点标签检索为主界面（不是行业/公司列表），次要筛选维度为行业、交付模式、证据等级、详细度。
- 案例详情：单条独立页面，可分享单条链接；决策语言块（decision_info）置顶展示。
- 模式详情：单条独立页面，列出佐证案例；案例与模式双向互链。
- 每个页面显式标注证据等级与来源，继承上游的诚实标注传统。

## 5. 阶段划分

| 阶段 | 内容 | 出口标准 |
| --- | --- | --- |
| M1 数据迁移 | 删减 + schema 改造脚本，cases.json v1 | 见第 6 节验收指标 |
| M2 模式库 v1 | fde_actions 频率统计 → 模式抽象 → patterns.json | 8-12 个模式，每个 ≥2 佐证案例 |
| M3 页面 | 首页 + 案例详情 + 模式详情，GitHub Pages 上线 | 可公开访问 |
| M4 扩容 | 从 genai-llm-ml-case-studies 等来源补新案例 | 案例数 ≥150 且新案例全部走完整 schema |

## 6. 验收指标（M1 出口）

1. cases.json v1 案例数 60-90 条（砍掉概览级、筛掉低价值标准级之后的合理区间，以实际复核为准）。
2. 每条保留案例：pain_points 非空（≥1 个标签）、decision_info 五字段完整、delivery_pattern 非空。
3. pain-points.json 标签数 15-25 个，每个标签下 ≥2 条案例。
4. 每条案例保留上游 evidence_level 与来源链接，署名文件完整（上游 LICENSE 与致谢段落）。
5. `npm test` 类校验脚本通过：必填字段、标签合法性、pattern_links 指向存在。

## 7. 未决事项

1. 仓库名与品牌呈现（墨予镜署名 vs 中性组织名）——影响 LICENSE 署名行与页面 footer。
2. 新仓库建在哪个 GitHub 账号下（候选人账号 vs 独立组织账号）。
3. 英文版是否做：上游有英文数据，重建后英文版工作量翻倍，建议 M3 之后再议。
4. 是否接受外部投稿（CONTRIBUTING）：做了能涨数据量，但引入审核成本；建议 M3 上线后再开。
