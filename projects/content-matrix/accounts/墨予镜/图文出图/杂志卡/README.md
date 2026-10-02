# 墨予镜 · 杂志卡模板

guizang Editorial（编辑杂志）版式的墨予镜定制版，蓝金配色，用于公众号贴图 / 小红书图文。

## 两套主题

| 主题 | 目录 | 底色 | 正文 | 点缀 |
|---|---|---|---|---|
| 青金（浅色） | `青金/` | #e9ecf1 | #1e2a45 | #b08f4d |
| 墨夜青金（深色） | `墨夜青金/` | #173673 | #f5f1e6 | #d3a86b |

每个主题目录自包含：`index.html`（版面 + 文案）、`assets/`（墨流背景脚本）、`output/`（渲染产物）。

## 渲染

在本目录跑：

```bash
node render.mjs
```

渲染该目录下所有主题，产物在各主题 `output/NN.png`（1080×1440，2x）。脚本依赖 `skills/healing-card/node_modules` 里的 Playwright。

注意：渲染时脚本会隐藏墨流画布和纸洗渐变、只留轻颗粒——headless 截图下 WebGL 画布会合成成白色（浏览器里直接打开 HTML 不受影响）。

## 新做一套卡片

1. 复制一个主题目录到任务位置（如 `图文出图/<选题名>/`）
2. 改 `index.html` 里 `.poster.xhs` 的文案（每页一个 section）
3. 用同目录结构的 render 脚本出图
