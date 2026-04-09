# 一镜一梳项目入口

> 状态：current
> 版本：0.3.0
> owner：CEO / Orchestrator
> 最后更新：2026-04-08
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md
> 对应项目工作区：[/Users/xinran/Downloads/dev/mindsync/projects/aimandala](/Users/xinran/Downloads/dev/mindsync/projects/aimandala)
> 历史来源仓库：[/Users/xinran/Downloads/dev/ai-mandala](/Users/xinran/Downloads/dev/ai-mandala)

这份文档是 `mindsync` 中 `一镜一梳` 的项目级入口。

它用于承接公司侧长期保留的项目定位、研究结论、状态纪要与内容资产入口。
账号归属默认规则与内容矩阵保持一致：

- `一镜一梳` 产品号内容，归 `一镜一梳` 项目
- 发布到 `墨予镜` 个人号的内容，归 `墨予镜 IP`

## 1. 当前定位

`一镜一梳` 是 `墨予镜` 在曼陀罗疗愈方向上的核心项目。

当前正式定位应以 `To C MVP Spec` 为准，现阶段核心判断是：

- 当前主线聚焦 To C 用户
- 用户通过上传自己的曼陀罗绘画，获得结构化、可阅读的解读报告
- 当前产品主路径由 `一镜 Lite 版` 与 `一梳 Pro 版` 组成
- 当前用户端主入口是手机端 Web
- 当前产品号内容应优先做用户教育、价值建立和产品认知，而不是只做 build in public

这意味着：

- `一镜一梳` 产品号现在已经具备启号条件
- 启号内容应以用户问题、产品方法与阶段性进展为主
- 发布到 `墨予镜` 个人号的相关内容，继续归 `墨予镜 IP`

## 2. 固定必读

任何 Agent 第一次进入 `一镜一梳` 项目时，默认优先读取以下材料：

1. [PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md)
2. [AI-Mandala-迁移范围与工作区草案.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/AI-Mandala-迁移范围与工作区草案.md)
3. [projects/aimandala/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/PROJECT.md)
4. [projects/aimandala/docs/specs/2026-04-04-toc-mvp-spec.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-04-toc-mvp-spec.md)
5. [content/一镜一梳-产品号内容策略简报.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/content/一镜一梳-产品号内容策略简报.md)
6. [content/一镜一梳-首批选题清单.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/content/一镜一梳-首批选题清单.md)
7. [content/一镜一梳-启号首发内容大纲.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/content/一镜一梳-启号首发内容大纲.md)
8. [content/2026-04-08-双账号启号周发布计划.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/content/2026-04-08-双账号启号周发布计划.md)

如果任务明确涉及后续代码迁移或目录设计，应继续以第 2 条文档为当前迁移范围依据，避免把暂不纳入的产品线和实验能力一起带入 Monorepo。

如果任务明确是发布到 `墨予镜` 个人号的一镜一梳相关内容，还应继续读取：

9. [company/projects/墨予镜IP/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/墨予镜IP/PROJECT.md)
10. [company/projects/墨予镜IP/content/一镜一梳/墨予镜-一镜一梳-build-in-public-内容策略简报.md](/Users/xinran/Downloads/dev/mindsync/company/projects/墨予镜IP/content/一镜一梳/墨予镜-一镜一梳-build-in-public-内容策略简报.md)
11. [company/projects/墨予镜IP/content/一镜一梳/墨予镜-一镜一梳-首批选题清单.md](/Users/xinran/Downloads/dev/mindsync/company/projects/墨予镜IP/content/一镜一梳/墨予镜-一镜一梳-首批选题清单.md)
12. [company/projects/墨予镜IP/content/一镜一梳/墨予镜-一镜一梳-启号首发内容大纲.md](/Users/xinran/Downloads/dev/mindsync/company/projects/墨予镜IP/content/一镜一梳/墨予镜-一镜一梳-启号首发内容大纲.md)

## 3. 目录边界

- `company/projects/一镜一梳/`
  - 放公司侧长期保留的项目文档和资产入口
- `projects/aimandala/`
  - 放项目工作区、实现与项目专属文档

默认内容资产边界：

- `company/projects/一镜一梳/content/`
  - 放 `一镜一梳` 产品号内容资产
- `company/projects/墨予镜IP/content/一镜一梳/`
  - 放来源于 `一镜一梳`，但发布到 `墨予镜` 个人号的内容资产

## 4. 当前最重要的两件事

眼下 `一镜一梳` 不是缺方向，而是缺两条可持续运转的链路：

1. 研究中心要稳定给它输送可用于用户教育和内容判断的上游素材
2. `一镜一梳` 产品号和 `墨予镜` 个人号都要正式启号

因此当前默认优先级是：

1. 跑通内容启动节奏
2. 保持产品定位与内容口径一致
3. 不在启号阶段夸大产品能力或进度
