# 墨予镜课程平台项目工作区

> 状态：draft
> 版本：0.1.2
> owner：CEO / Engineer
> last_updated：2026-09-11
> source_of_truth：projects/course-platform/PROJECT.md

这是 `墨予镜课程平台` 在 Monorepo 中的项目工作区入口。

## 1. 项目是什么

`墨予镜课程平台` 是知行工坊唯一的 AI 互动课程交付平台，基于开源项目 [ai-shifu](https://github.com/ai-shifu/ai-shifu)（AI 互动课平台）fork 定制部署。

平台对外统一挂 `墨予镜` 品牌，承载多条课程内容线：

- `疗愈课程线`：内容由 [healing-courses](../healing-courses/PROJECT.md) 项目产出
- `AI 课程线`：内容项目待定

一套部署、一个后台、多门课程。课程之间在平台内互相隔离，学员按课进入。

## 2. 架构约定

- 单实例部署：一套 ai-shifu（Next.js 前端 + Python 后端 + MySQL + Redis）
- 入口页按课程线拆分：每条产品线一个落地页（平台内课程页或平台外静态页），按钮统一进入平台对应课程
- 品牌统一为 `墨予镜`，避免品牌与单一内容线过度绑定
- 定制分层：优先环境变量/配置文件，其次主题样式覆盖，最后才改代码；改动保持独立 commit 便于合并上游

## 3. 当前阶段

`spec`。首门上线课程预计为 `曼陀罗自我疗愈入门`（内容侧见 healing-courses）。

进度：平台本地全栈已跑通（MySQL/Redis/后端/前端，见工程层第 6 节实操备忘），控制层状态位于 `source-ready → local-running` 之间；剩余阻塞项是配置真实 DeepSeek API Key 后完成一轮互动学习复验。fork 方案待定（当前 app/ 为上游仓库的直接克隆，未改 remote）。

## 4. 目录约定

- `specs/`：平台规格，按四层组织（设计层/控制层/工程层/验收层），入口见 [specs/README.md](./specs/README.md)
- `docs/`：平台使用说明、后台操作手册
- `runbook/`：部署、运维、故障处理记录
- 源码目录 `app/`：上游 ai-shifu 的直接克隆（含独立 git 仓库，mindsync 侧已 gitignore；fork 方案确定后改 remote）

## 5. 协作边界

- 课程内容、课程脚本、Course Prompt 归各内容项目（如 healing-courses）维护，不放进本项目
- 本项目只管平台跑起来、品牌定制、部署运维
- 课程在生产平台后台配置完成后，内容项目只保存脚本文档与导入文件的源文件
