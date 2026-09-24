# 疗愈文生图配方（style recipes）

视觉依据：`projects/healing-courses/docs/曼陀罗自我疗愈入门课程输入稿.md` 4.2 节——
低饱和、柔和、稳定；圆、层层展开的结构、安静的中心、自然生长感；自然意象与抽象图形；不要复杂压迫、强对抗、诊断感、医疗化。

## 1. 基底风格锚（所有配方共享，写死在 gen_art.mjs BASE）

```
hand-painted mandala artwork, watercolor and colored pencil on textured cream paper,
muted low-saturation palette, soft diffused natural light,
gentle radial symmetry around a quiet center, slow natural growth feeling,
calming healing aesthetic, generous negative space,
no text, no letters, no watermark
```

改风格 = 改 BASE，一次改动全账号生效。批量出图时不要绕开 BASE 另写风格词。

## 2. 构图配方

| recipe | 构图 | 用途 |
|---|---|---|
| cover | 一个大曼陀罗几乎充满画面，层叠花瓣与环，中心略高于画面中线 | 小红书首图、封面底图（可再压标题字） |
| corner | 小曼陀罗从画面下角生长，藤蔓向外缓慢展开，上半部大量安静留白 | 需要叠加文字的卡（角落实景+文字区） |
| texture | 极淡的超大曼陀罗纹样作纸面纹理，线条近乎不可见，接近纯色奶油纸 | 整卡打底、系列图统一底 |

## 3. 情绪色系（mood）

| mood | 色系 | 适用内容 |
|---|---|---|
| calm（默认） | 暖沙、燕麦、软陶土 | 安定、入门、通用 |
| sorrow | 雾蓝、灰薰衣草、淡墨 | 低落、委屈、失去 |
| anxiety | 鼠尾草绿、浅苔、暖灰 | 焦虑、紧绷、散乱 |
| warm | 烟粉、暖杏、柔棕 | 感恩、自我照顾、温暖收束 |

## 4. 自定义 prompt 规则

- 必须保留 BASE 的 `no text, no letters, no watermark` 与低饱和约束，在 BASE 之后追加内容词。
- 内容词用英文写意象（mandala, petals, stones, leaves, ripples），情绪词可中文试写但建议用 mood 变量替代。
- 需要真人作品感时追加：`slightly imperfect hand-drawn lines, visible pencil strokes`。
