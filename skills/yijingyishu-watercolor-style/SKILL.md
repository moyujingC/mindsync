---
name: yijinyishu-watercolor-style
description: Generate 一镜一梳水彩拼贴风插画（watercolor collage illustration）——温暖纸感、深蓝/赭石/灰绿配色、撕纸拼贴边缘、少字多图的治愈系文生图风格。Use when the user asks for 一镜一梳插画, 水彩拼贴插画, 疗愈系配图, 小红书/公众号卡片配图, 或任何需要本风格 DNA 的 AI 生图。
---

# 一镜一梳水彩拼贴风 · 文生图风格 skill

只负责**生图**这一层：给定画面内容描述，产出本风格的水彩拼贴插画 PNG。
不负责卡片排版（标题/徽章/水印由 `yijinyishu-card` 的 HTML 模板渲染）——本 skill 与卡片 skill 配合：这里出图，那里排版。

## 快速上手

```bash
node scripts/generate.mjs <prompt.txt|纯文本> <out.png> [portrait|landscape] [--bleed]
```

- 风格前缀（配色/质感/禁文字）内置在 `scripts/generate.mjs`，是**单一源头**；prompt 文件只写画面内容。
- `portrait` = 1024×1536（3:4 竖版卡用图）；`landscape` = 1536×1024（16:9 横版配图）。默认 portrait。
- `--bleed`：满版出血图用——要求画面内容延伸到四边、不留白边（卡片 hero 满版布局的配图必须加）。
- 通道：AITechFlux 中继 gpt-image-2，key 读 `projects/content-matrix/内容视觉工坊V2/.env.local`（可用环境变量 `ART_ENV_PATH` 指向其他 env）。

## 何时读哪个参考

| 场景 | 文件 |
| --- | --- |
| 了解/复用风格 DNA（配色 hex、母题、情绪、边缘处理） | `references/style-dna.md` |
| 写 prompt（构图模板、翻车模式与修法） | `references/prompt-playbook.md` |
| 看成品长什么样 | `examples/`（demo 缩略图） |

## 风格一句话

手绘水彩拼贴插画：米色纸底 #f7f2e7，主色深蓝 #1f3d6b、赭石 #b8623c、灰绿 #6c7f5c；柔和晕染 + 撕纸拼贴边缘 + 枝叶点缀；温暖安静、留白充足、治愈系编辑风格。**图中禁止任何文字、字母、数字、水印、logo**——文字一律由排版层渲染。

## 产出约定

- 一套图的 prompt 文本与成品 PNG 存同一任务文件夹，可复现。
- 交付前逐张检查：无文字/字母/数字残留；单场景图主体居中不被裁；同套图色调同族；hero 满版图确认 `--bleed` 生效（四边无留白）。
