---
name: media-transcribe
description: 将媒体文件抽音频并转写为 transcript，支持可切换 ASR backend。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - ceo
  - content
when_to_use: >
  当已经拿到视频或音频文件，需要将其转写为可研究、可核查的 transcript 时使用。
inputs:
  - media file
  - source-pack
  - preferred asr backend
outputs:
  - transcript
  - transcribe result
handoff_to:
  - Research & Knowledge Lead
  - Content Lead
---

# Media Transcribe

## 目标

把媒体文件稳定转成可读 transcript，并为后续研究、核查和 review 提供文本输入。

## 适用场景

- 已获取视频文件
- 已获取音频文件
- 需要对中文短视频进行转写

## 不适用场景

- 还没有任何可处理媒体文件
- 当前输入已经是足够可用的 transcript

## 必读上下文

1. 当前项目 `PROJECT.md`
2. 当前 source-pack
3. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-06-媒体链接摄取与转写共享能力-SPEC.md`

## 执行步骤

1. 检查当前是否已有可处理媒体文件。
2. 若输入是视频，先抽音频。
3. 选择 ASR backend：
   - `sensevoice`
   - `faster-whisper`
   - 其他可用 backend
4. 执行转写并保留结果。
5. 判断 transcript 是否达到最小可用标准。
6. 写清后续是继续研究、补人工修正还是重新获取输入。

## 输出格式

建议输出：

- transcript 正文
- backend 记录
- 失败说明或质量说明

## 质量检查项

- 是否记录使用了哪个 backend
- 是否记录转写失败或明显低质量问题
- 是否达到最小可读标准
- 是否可回链到原始 source-pack

## Handoff 规则

- transcript 达标后，可交给 Research 进入正式研究
- 若转写质量不足，应先记录问题，不直接生成正式研究结论
