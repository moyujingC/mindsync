> 状态：current
> 日期：2026-08-17
> 项目：内容矩阵（项目 A）· 墨予镜起号
> 用途：换窗口交接，接续当前进度

# 进度 Handoff：公众号排版复刻 + 风格复刻

## 一句话定位

已建成「公众号排版复刻 skill」，从两个真实公众号复刻出两套风格规格；下一步用这两套风格给成稿排版，**测试排版效果**。

## 当前进度（已提交）

1. **wechat-style-replicator skill 建成**：[skills/wechat-style-replicator/](../accounts/墨予镜/skills/wechat-style-replicator/)
   - 链路：抓链接（UA 伪装）→ 抽风格（比例化 token JSON）→ 出公众号草稿 HTML + 小红书 3:4 卡片
   - 脚本：`fetch-article.mjs` / `extract-style.mjs` / `render-wechat.mjs` / `render-xhs.mjs`（lib 下三个纯函数模块）
   - 依赖：node-html-parser（首次 `npm i`）

2. **两套风格已复刻**（[styles/](../accounts/墨予镜/styles/)）：
   - `墨予镜-mdnice.json` —— 正文 #333333 / 蓝雾标题 #6e7fa8 / 行高 1.8
   - `增长女黑客-橙色强调.json` —— 正文 #3f3f3f / 黑色标题 + 橙色边框 #e8501a / 行高 1.6

3. **风格规格能力**（[references/风格规格说明.md](../accounts/墨予镜/skills/wechat-style-replicator/references/风格规格说明.md)）：
   - 比例化 token：字号存相对正文字号的比例，切视口（公众号 16px / 小红书 34px）自动缩放
   - 支持：标题边框装饰（border）、rgb/命名色转 hex、h2 优先标题识别、标题样式下钻 span

## 关键规范（沿用）

- **图片不进 git**：`小红书出图/` 已 ignore
- **抓取原文快照不进 git**：`reference-samples/*/content.html`、`meta.json` 已 ignore
- **草稿/成稿分离**（账号写作规则）：草稿定内容、成稿定表达

## 下一步（第一优先）：测试排版效果

用两套风格，把成稿《企业上AI，先别急着选工具》排版，各出一版「公众号版 + 小红书版」，对比排版差异。

成稿：[2026-08-17-企业上AI先别急着选工具-成稿.md](../accounts/墨予镜/2026-08-17-企业上AI先别急着选工具-成稿.md)

### 公众号版

```bash
cd projects/content-matrix/accounts/墨予镜/skills/wechat-style-replicator
node scripts/render-wechat.mjs <成稿.md> <styles/风格名.json>
```

输出 `<成稿名>-公众号成品.html`（带内联样式）。

**发草稿箱（现状：不可行，默认富文本复制）**：
- 微信草稿箱接口 `draft/add` 需要公众号 AppID + AppSecret → access_token，且需认证账号的草稿箱权限。当前项目**没有任何公众号 API 凭证**，无法直发。
- 默认走「富文本复制」：浏览器打开输出的 HTML → 全选 → 复制 → 粘贴到公众号编辑器。
- 若「直发草稿箱」是硬需求：需用户提供公众号 AppID/AppSecret（配 `.env`，不入 git），再补一个 `publish-draft.mjs` 调草稿箱接口。**待用户决定是否做**。

### 小红书版

```bash
node scripts/render-xhs.mjs <成稿.md> <styles/风格名.json>
```

输出 `小红书出图/原文版/full-*.png`（封面 + 流式分页正文）。

### 验收点

- 公众号版：正文色 / 标题色 / 标题边框 是否与目标风格一致
- 小红书版：分页数、字号、标题竖条边框是否正常
- 两套风格各出一版，对比差异（蓝雾 vs 橙色）

## 后续队列

- 「直发草稿箱」若确认要做：补公众号 API 凭证 + `publish-draft.mjs`
- 复刻更多欣赏的公众号风格（skill 已验证跨账号通用）
- 首篇公众号手动发布（对照 FDE 定位 spec 质量门）+ 填回流表
