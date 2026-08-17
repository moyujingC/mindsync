---
name: moyujing-article-editor
description: Use when refining an existing Chinese article draft for 墨予镜 from draft to publishable form, especially when the core观点 and structure already exist but the work now is reader fit, structure review, expression de-noising (去AI味 / de-AI / 表达降噪), style calibration (表达准确 / 像人话 / 黄有璨风格), title crafting (起标题 / 标题润色 / 改标题), or final pre-publish checks for公众号-style content. Triggers include 润色、改写、去AI味、去机器味、降噪、像人话、表达准确、成稿编辑、起标题、改标题、标题润色.
---

# Moyujing Article Editor

## Overview

Use this skill to push a draft from `草稿 -> 成品`.

This skill is for editing, not ideation. It assumes the article already has a topic, a main view, and enough material. The job here is to make it clearer, tighter, more like `墨予镜`, and more suitable for ordinary公众号 readers.

## Use This Skill Correctly

Use it when:

- the main judgment already exists
- the draft structure is mostly there
- the bottleneck is expression, rhythm, information density, or publishability
- the article is drifting toward `同行文`, `报告腔`, or `AI 完整文章感`

Do not use it when:

- the topic is still fuzzy
- the author is still brainstorming
- evidence is missing
- the real need is first-draft generation

## Core Rules

1. Edit instead of rewrite.
2. Fix structure before polishing sentences.
3. Align to reader before aligning to tone.
4. Default to subtraction: cut, merge, shorten, move key lines forward.
5. Let AI find issues and candidates; let the user keep final authorship.

## Workflow

Run these six rounds in order. Do not collapse them into one vague “润色”.

1. Reader and purpose calibration
2. Structure review
3. Expression de-noising
4. Style calibration
5. Title crafting
6. Pre-publish check

For the exact prompts and output shapes, read [references/editing-rounds.md](references/editing-rounds.md).

The `Expression de-noising` round (round 3) must first read [references/ai-de-style.md](references/ai-de-style.md) — the 11 AI-writing patterns + hard constraints + noise budget — instead of guessing what "AI-flavored" means. The `Style calibration` round (round 4) applies the 黄有璨 "表达准确" anchors (precise judgment, clear taxonomy, concrete image, every sentence advancing, ending hands the judgment back). The `Title crafting` round (round 5) must first read [references/title-crafting.md](references/title-crafting.md) — the 标题 DNA + 模式库 + 质量门 — and trace every title back to the article's core judgment instead of guessing "起个标题".

## Style Constraints

Default `墨予镜` constraints:

- direct
- concrete
- low fluff
- low jargon
- low `同行炫技`
- not overly complete
- problem-oriented, not sermon-like
- let the reader know early what the article is trying to say

Avoid:

- `太干太专业`
- `方法论报告腔`
- long and full paragraphs
- abstract words stacked for momentum
- repetitive explanation
- mechanical `不是 X，而是 Y`
- defensive framing like `不在于 A，也不在于 B，而在于 C` unless it is correcting a real reader misunderstanding

## Route by Article Type

Before editing, identify which anchor type the draft is closest to.

Current anchor types:

1. `个人节点型`
2. `趋势判断型`
3. `阶段判断型`
4. `概念拆解型`
5. `人物剖面型`
6. `招募转化型`
7. `研究拆解型`

Read [references/style-anchors.md](references/style-anchors.md) for:

- when each type applies
- the reusable structure
- the key transferable rules
- the main failure modes

## Use Reference Samples Sparingly

Use the sample library only after you know the article type.

Do not load all samples. Read only the sample files that match the current draft’s type. The sample files live at:

- [../../reference-samples](/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/accounts/墨予镜/reference-samples)

If the draft is:

- a public issue or AI hot topic: start with `趋势判断型`
- a stage model or growth path: start with `阶段判断型`
- a “是不是一回事” concept distinction: start with `概念拆解型`
- a founder or creator profile: start with `人物剖面型`
- a workshop/product/community invitation: start with `招募转化型`
- a report, podcast, or long external material summary: start with `研究拆解型`
- a personal milestone with a broader judgment: start with `个人节点型`

## Expected Outputs

Depending on the round, good outputs look like:

- who this article is really written for
- which parts sound like `同行文`
- which paragraphs should be cut
- where the core view should move forward
- which sentences are empty or too AI-like
- which headline or ending still feels wrong

Do not default to whole-article rewriting unless the user explicitly asks for it after review rounds.

## Common Mistakes

- saying only `帮我润色一下`
- mixing structure, style, title, and ending in one pass
- expanding during the finishing stage
- rewriting so much that the original judgment disappears
- writing for peers instead of准客户 or ordinary readers

## Minimum Path

When time is short, do only:

1. structure review
2. expression de-noising
3. pre-publish check
