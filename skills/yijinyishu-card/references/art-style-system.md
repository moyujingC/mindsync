# 插画拼贴风 · 风格系统

参考稿：手绘水彩拼贴知识卡（米白纸底、少字多图、撕纸拼贴边缘、植物枝叶点缀）。

## 配色（自参考稿取样）

| 角色 | 色值 | 用途 |
| --- | --- | --- |
| 纸底 `--bg` | `#f7f2ea` | 画布底色（细点纹理） |
| 深蓝 `--navy` | `#1f3d6b` | 标题/正文/蓝徽章 |
| 赭石 `--clay` | `#b8623c` | 笔触下划线/赭石徽章/小太阳点 |
| 灰绿 `--green` | `#43684a` | 绿徽章 |
| 鼠尾草 `--sage` | `#6c7f5c` | 枝叶装饰 |
| 副题 `--ink` | `#57534a` | 副题 |
| 卡纸 `--paper` | `#fbf8ef` | 拼贴画片底 |

徽章三选（`badge_class`）：`badge-blue` #2b4d7d / `badge-clay` #b8623c / `badge-green` #43684a，套卡内可轮换。

## 字体

- 标题/徽章：宋体系粗体（Songti SC / Noto Serif SC）。
- 正文/副题：PingFang SC。

## 画幅与平台

| canvas | 像素（@2x） | 用途 |
| --- | --- | --- |
| `portrait` | 1080×1440（2160×2880） | 小红书、公众号图文（3:4） |
| `landscape` | 1080×608（2160×1216） | 公众号正文配图（16:9） |

## 页面骨架

- 竖版：顶部居中标题（宋体深蓝 88px）→ 赭石笔触下划线 → 副题（发丝线+小叶对）→ 拼贴舞台 → 两行正文 → 徽章（两侧枝叶）→ 角落枝叶 → 右下水印。
- 横版：左 400px 文字栏（标题左对齐 54px + 下划线 + 副题 + 正文 + 徽章），右侧拼贴舞台。
- 拼贴舞台：水彩底斑（蓝/绿/赭径向渐变）+ 主图（拱形 mask-arch，卡纸+微旋转底层）+ 1~3 张小圆图（mask-circle）；角落固定枝叶 SVG。

## 版式（layout）

| layout | 说明 |
| --- | --- |
| `hero`（竖版推荐） | 满版插画出血：一张大图横贯画布，上下撕纸边（deckle）+ 底角撕纸山形；标题区 + 底部正文/徽章 |
| `collage`（默认） | 拼贴舞台：拱形主图 + 1~3 圆形小图 + 卡纸底 + 水彩底斑；适合小图组合 |

hero 版式配图为「一张满版拼贴大图」（生图 prompt 要求整幅充满、多场景撕纸衔接，参考稿做法），collage 版式配图为「主图 + 小圆图」分别生成。

## cards.json 字段契约

| 字段 | 说明 |
| --- | --- |
| `name` | 输出文件名（NN-标题） |
| `canvas` | `portrait` / `landscape` |
| `layout` | `hero` / `collage`（默认 collage；hero 仅竖版） |
| `badge_class` | 徽章配色，三选一 |
| `title` | 标题（可含「一、」序号） |
| `title_sprigs` | true=标题两侧大枝叶（hero 推荐） |
| `sun` | `left`/`right`，标题上方赭石太阳圆点 |
| `underline` | `brush`（默认，笔触线）/ `ruledot`（—●— 点线）/ `none` |
| `sub` / `sub_rule` | 副题 / 副题是否带发丝线小叶 |
| `para` | 正文（`\n` 换行，建议 ≤2 行） |
| `para_layout` | `block`（默认居中）/ `split`（小笔刷标签 \| 竖线 \| 正文，配 `para_label`） |
| `badge` / `badge_style` | 徽章文字（2~6 字）/ `brush`（默认，毛边笔刷形）/ `pill`（胶囊形） |
| `mountains` | hero 底角撕纸山形，false 可关 |
| `watermark` | 默认「轻疗愈」 |
| `images.main` | 主图（必填），m1~m3 小圆图（collage 用，可缺省） |
| `img_focus` | 如 `{"main": "72% 42%"}` 调主图 object-position 取景 |

## 生图规范（generate_art.mjs）

- 一条命令一张图：`node scripts/generate_art.mjs <prompt.txt> <out.png> [portrait|landscape]`。
- prompt 文件只写画面内容；风格前缀（水彩拼贴、配色、禁文字）脚本内置。
- 竖版主图 1024×1536，横版 1536×1024，小图可复用竖版图（圆形裁切）。
- 图中严禁任何文字/字母/数字（文字一律由 HTML 模板渲染）。
