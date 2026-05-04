---
name: media-link-intake
description: 把抖音、小红书等媒体链接转成可继续处理的 source-pack，并提供稳定 fallback。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - ceo
  - content
when_to_use: >
  当输入是抖音、小红书或其他媒体链接，需要先把链接转成可研究、可转写、可核查的 source-pack 时使用。
inputs:
  - media link
  - creator note
  - current project anchor
outputs:
  - source-pack
  - intake decision
handoff_to:
  - Research & Knowledge Lead
  - Content Lead
---

# Media Link Intake

## 目标

把“一个媒体链接”收束成稳定 source-pack，而不是让后续角色直接卡在平台读取失败上。

## 适用场景

- 抖音视频链接
- 小红书视频链接
- YouTube 链接
- X 链接
- 其他短视频或中长视频链接
- 用户提供本地视频文件

## 不适用场景

- 输入已经是整理好的 transcript
- 当前阶段已经进入正式研究或核查
- 当前输入不是媒体，而是纯文本材料

## 必读上下文

1. 当前项目 `PROJECT.md`
2. 当前任务上下文
3. `projects/research-center/specs/2026-04-06-媒体链接摄取与转写共享能力-SPEC.md`

## 执行步骤

1. 判断平台和输入类型。
2. 先按平台分流：
   - 抖音 / 小红书：
     - 优先接收 `Get 笔记` 公开链接或人工确认后的文字版
     - 默认不要求当前链路直接完成自动转写
   - YouTube / X：
     - 进入自动媒体摄取主链
3. 若进入自动链路，则优先尝试自动获取媒体文件或正文。
   - 当前 baseline：先试 `yt-dlp`
   - 若通用下载失败，再考虑平台专用 downloader
4. 若失败，切换到半自动 fallback：
   - 截图
   - 文案
   - 口播摘要
   - 评论区关键信息
5. 将当前可得材料整理成 source-pack。
6. 明确下一步是否可进入 `media-transcribe`、中文化处理或正式研究。

## 输出格式

建议基于：

- `templates/source-pack-模板.md`

当前可用本地工具：

- `shared/tools/media-link-intake.sh`

## 质量检查项

- 是否保留原始链接
- 是否记录获取方式
- 是否记录失败原因或 fallback 情况
- 是否已达到后续可继续处理的最小输入标准
- 是否明确写出当前用了哪一层 baseline

## Handoff 规则

- 若已获取媒体文件，优先交给 `media-transcribe`
- 若输入已经是 `Get 笔记` 文字版，可直接交给 Research
- 若未获取媒体文件但 source-pack 已足够，也可交给 Research 继续
- 若 source-pack 仍不足，必须明确写出阻塞点
