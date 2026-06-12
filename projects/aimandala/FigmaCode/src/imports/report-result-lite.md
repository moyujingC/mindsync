# 报告结果页（Lite版）

> 与现有上传页同一工程，沿用设计规范
> 页面宽度：375px（移动端网页）

---

## 页面定位

**用户场景**：用户已完成分析，查看Lite版解读报告

**入口**：加载页分析完成 → 自动跳转

**出口**：
- 底部「解锁完整版」→ Pro购买流程
- 「保存报告」→ 保存图片/分享
- 「重新上传」→ 返回上传页

---

## 报告内容结构（Lite版）

根据prompt-lite-base.md，Lite版包含：

1. **画像标题**（诗意标题，3-8字）
2. **整体印象**（1-2句话直觉描述）
3. **6个核心看见**
   - 你的底色（基础性格/状态）
   - 你的矛盾（内在冲突）
   - 你的模式（重复行为）
   - 你的防御（保护机制）
   - 你的卡点（核心议题，**不提及失衡类型名称**）
   - 你的光（内在力量）
4. **一个小实验**（当天可执行的行动）
5. **深度探索入口**（Pro转化区）

---

## 页面结构（纵向滚动）

### 顶部导航

- 左侧：返回箭头（返回上传页）
- 中间：「解读报告」
- 右侧：分享按钮

---

### 报告头部

**用户画作缩略图**：
- 100px圆形
- 金色边框
- 位于页面顶部居中

**报告标签**：
- 「Lite版」标签（浅色背景）
- 位置：画作右下角

**画像标题**：
- 大字号（22px），居中
- 诗意标题，如「冰封的太阳」

**生成时间**：
- 小字（12px，灰色）
- "2026年3月8日生成"

---

### 整体印象

**卡片样式**：
- 米白背景，圆角16px
- 全宽-40px边距
- 内边距20px

**内容**：
- 小标题：「整体印象」
- 正文：1-2句话直觉描述
- 文字风格：温暖、诗意

**示例**：
> "这是一幅充满生命力的画作，像春日里急切绽放的花朵，带着想要被世界看见的渴望。"

---

### 6个核心看见（重点）

**布局**：纵向排列，每个洞察一个卡片

**卡片样式**：
- 米白背景，圆角12px
- 左侧彩色条（不同颜色区分）
- 图标 + 标题 + 内容

**6个卡片**：

| 序号 | 标题 | 图标建议 | 颜色条 |
|------|------|----------|--------|
| 1 | 你的底色 | 🎨 | 绿色 |
| 2 | 你的矛盾 | ⚡ | 橙色 |
| 3 | 你的模式 | 🔄 | 蓝色 |
| 4 | 你的防御 | 🛡️ | 紫色 |
| 5 | 你的卡点 | 💫 | 红色 |
| 6 | 你的光 | ✨ | 金色 |

**内容长度**：每个50-80字

**第5个（你的卡点）特殊处理**：
- **不显示失衡类型名称**（如"水多火晦"）
- 只描述感受和表现

---

### 一个小实验

**样式**：
- 深海军蓝背景（与整体形成对比）
- 圆角16px
- 全宽-40px

**内容**：
- 标题：「一个小实验」
- 图标：🔬
- 正文：具体可执行的行动建议
- 底部小字："今天就可以尝试"

**示例**：
> 这周尝试一次"不完美的展现"：发朋友圈时，不P图、不斟酌文案，直接发一张随手拍。
>
> 观察：世界崩塌了吗？还是其实没人注意到"不完美"？

---

### Pro转化区（深度探索入口）

**背景**：米白渐变或带纹理背景

**标题**：「画中还藏着更深层的秘密」

**Pro版包含内容（列表）**：
```
✓ 完整五行能量格局分析
✓ 20种失衡类型深度识别
✓ 三圈能量流动关系图
✓ 模式的童年根源追溯
✓ 个性化21天疗愈方案
✓ 每日练习指导
```

**价格信息**：
- "Pro深度版：39元"
- 原价划线："原价99元"
- 限时标签："限时特惠"

**CTA按钮**：
- 「解锁完整版」
- 金色渐变，胶囊形状
- 全宽-40px

**小字**："已解锁 Lite 版，升级可享完整分析"

---

### 底部操作区

**按钮组**：
```
[保存报告]  [重新上传]
```

- 两个按钮并排
- 次要样式（白色背景，金色边框）

**保存说明**：
- 小字："保存为图片，带二维码分享"

---

## 设计重点

1. **阅读体验优先**
   - 卡片式布局，信息分块清晰
   - 适当留白，阅读舒适
   - 字体层次分明

2. **温暖有温度**
   - 文案风格：像一位理解你的朋友
   - 配色柔和，不刺眼
   - 第6个「你的光」重点突出（赋能）

3. **Pro转化自然**
   - Lite内容完整有价值（不让用户觉得被欺骗）
   - Pro升级是「更深层的秘密」，不是「Lite不完整」
   - 转化区设计突出但不突兀

4. **分享传播**
   - 保存的图片带二维码
   - 引导他人扫码体验

---

## 跳转关系

```
报告页
├── 点击「解锁完整版」→ 支付流程 → Pro报告页
├── 点击「保存报告」→ 生成分享图片（带二维码）
├── 点击「重新上传」→ 上传页
└── 点击返回 → 上传页
```

---

## Figma Make 提示词

```
Create a mobile report result page (375px) for "一镜一梳" mandala interpretation app - Lite version.

Context: New page in existing project with upload page already designed. Use the same design system (colors, fonts from existing page).

Page Flow:
- Entry: Analysis complete from loading page
- Exit 1: Click "解锁完整版" → Payment flow → Pro report
- Exit 2: Click "保存报告" → Generate share image with QR code
- Exit 3: Click "重新上传" → Back to upload page

Page Structure:

1. Top Navigation:
   - Back arrow (left)
   - "解读报告" (center)
   - Share icon (right)

2. Report Header:
   - User's mandala thumbnail (100px circle, gold border)
   - "Lite版" label badge
   - Poetic title: "[画像标题]" (22px, centered)
   - Generated date: "2026年3月8日生成" (12px, gray)

3. Overall Impression Card:
   - Cream background, rounded 16px
   - Title: "整体印象"
   - 1-2 sentences of intuitive description (warm, poetic)

4. Six Core Insights (vertical cards):
   - Card style: cream background, left colored bar, icon + title + content
   - Six cards in order:
     1. 🎨 你的底色 (green bar) - 50-80字
     2. ⚡ 你的矛盾 (orange bar) - 50-80字
     3. 🔄 你的模式 (blue bar) - 50-80字
     4. 🛡️ 你的防御 (purple bar) - 50-80字
     5. 💫 你的卡点 (red bar) - 50-80字, NO imbalance type names
     6. ✨ 你的光 (gold bar) - 50-80字, empowering

5. One Small Experiment:
   - Navy blue background, rounded 16px
   - Title: "一个小实验" with 🔬 icon
   - Specific actionable suggestion
   - Subtext: "今天就可以尝试"

6. Pro Upgrade Section:
   - Gradient or textured background
   - Title: "画中还藏着更深层的秘密"
   - Feature list:
     * 完整五行能量格局分析
     * 20种失衡类型深度识别
     * 三圈能量流动关系图
     * 模式的童年根源追溯
     * 个性化21天疗愈方案
   - Price: "Pro深度版：39元" with strikethrough "原价99元"
   - Badge: "限时特惠"
   - CTA: "解锁完整版" (gold gradient, capsule)
   - Subtext: "已解锁 Lite 版，升级可享完整分析"

7. Bottom Actions:
   - Two buttons side by side:
     * "保存报告" (white bg, gold border)
     * "重新上传" (white bg, gold border)
   - Subtext: "保存为图片，带二维码分享"

Key Notes:
- Lite report should feel complete and valuable (not incomplete)
- Pro upgrade is "deeper secrets" not "fixing incomplete"
- Each insight card 50-80 Chinese characters
- Card #5 (卡点) must NOT show imbalance type names
- Card #6 (你的光) should be empowering and prominent
- Overall warm, friendly tone like a understanding friend

Use existing design system from upload page. Mobile-first, 375px width.
```

---

*与上传页同一工程，沿用设计规范*
*页面宽度: 375px*
*报告版本: Lite版（免费/9.9元）*
