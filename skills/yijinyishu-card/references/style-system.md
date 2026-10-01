# 疗愈书院风 · 风格系统

## 配色（自附件参考稿取样）

| 角色 | 色值 | 用途 |
| --- | --- | --- |
| 纸底 `--bg` | `#f7f3ea` | 画布底色，暖米白 |
| 墨绿 `--green` | `#1e4633` | 标题/条目标题/问题行/左条（绿卡） |
| 金赭 `--gold` | `#a8894a` | 编号/kicker/金句竖线/左条（金卡） |
| 正文 `--ink` | `#26261f` | 条目正文 |
| 次级 `--soft` | `#6f6c5f` | 副题、条目说明（d.soft） |
| 页眉页脚 `--faint` | `#8f8c7e` | 页眉品牌行、页脚 |
| 发丝线 `--hairline` | `#ddd5c2` | 页眉下、条目分隔、页脚上 |

## 字体

- 标题/编号/大序号：宋体系 `"Songti SC", "STSong", "Noto Serif SC", serif`，粗体。
- 正文/说明：`"PingFang SC", sans-serif`。

## 页面骨架（画布 1080×1440，padding 68/84/116）

1. 左缘 14px 竖条：`stripe-green` 或 `stripe-gold`。
2. 页眉：左品牌行（可加 ` / 系列名`），右页码 `NN / NN`，发丝线压底。
3. 内容区 `.body`（flex 纵向）：
   - 步骤卡：`.head-q`（页眉问题行）+ 发丝线 → `.big-num` 大序号 → `h1.title` 巨字 → `.sub` 灰色副题 → 3 个 `.item` → `.note` 金句条（`margin-top:auto` 靠底）。
   - 总览卡：`.kicker` 金赭引导句 → `h1.title`（可 `<br>` 断行）→ `.sub.green` 墨绿副题 → `.title-ul` 短下划线 → N 个 `.item`，body 加 `spread` 均布。
4. 页脚：发丝线 + 左系列名 + 右 `一镜一梳 · 知识与练习`。

## 组件清单（content 字段可用 class）

| class | 说明 |
| --- |
| `.head-q` | 页眉下的问题行，墨绿粗体 30px |
| `.hairline` | 独立发丝线（接在 head-q 后） |
| `.big-num` | 宋体墨绿 80px 步骤序号 |
| `h1.title` | 宋体墨绿 104px 巨字标题 |
| `.title-ul` | 标题下 108×7 墨绿短下划线（总览卡） |
| `.sub` / `.sub.green` | 33px 副题，默认灰；`.green` 墨绿粗体 |
| `.kicker` | 27px 金赭引导句 |
| `.item` | 编号条目：`<div class='h'><span class='num'>01</span><span class='t'>标题</span></div><div class='d'>说明</div>`；`.d.soft` 灰色说明 |
| `.note` | 金竖线金句条，30px，靠底 |

## 版式规则

- 步骤卡条目 3 个为宜，最多 4；总览卡条目最多 5。
- 左条配色：一套卡组内绿/金交替（01 绿、02 金…），或封面定一种。
- 页码三方一致：页眉右、文件名编号、卡组内顺序。
- 溢出处理：删字 > 减条目 > 换拆法；禁止缩字号、禁止改组件 CSS。
