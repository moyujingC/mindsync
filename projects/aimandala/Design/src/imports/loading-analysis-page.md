# 分析中加载页（Loading Page）

> 与现有上传页同一工程，沿用设计规范
> 页面宽度：375px（移动端网页）

---

## 页面定位

**用户场景**：用户已上传画作，等待AI分析结果（约15-20秒）

**入口**：上传页点击「开始解读」→ 进入加载页

**出口**：分析完成 → 自动跳转「报告结果页」

---

## 核心信息

- **当前状态**：AI正在解读曼陀罗画作
- **预计时长**：约15-20秒
- **免费次数提示**：第 X 次免费解读（如：第1/3次）

---

## 页面结构（单屏，简洁版）

### 顶部导航

- 左侧：返回箭头（返回上传页）
- 中间：扁平风版Logo「一镜一梳」
- 右侧：关闭按钮（返回落地页）

---

### 核心视觉区

**Logo动画**：
- 居中放置品牌拟物版Logo（150px）
- 动画效果：
  - 缓慢旋转（30s一圈）
  - 或：呼吸式缩放（脉动效果）
  - 或：金色光晕环绕
- 周围可添加：微妙的粒子漂浮效果

**状态文字**：
- 主标题：「正在解读中...」（18px，白色）
- 副标题：「AI正在分析您的曼陀罗画作」（14px，透明度0.7）

---

### 进度显示（简化版）

**进度条**：
- 宽度：280px（居中）
- 高度：6px
- 背景：半透明灰色
- 填充：金色渐变
- 动画：平滑增长

**百分比**：
- 数字：「65%」（24px，金色，字重600）
- 位置：进度条下方

**当前步骤**：
- 文字：「分析颜色分布...」（14px，白色）
- 显示当前分析阶段

---

### 分析日志（简化版）

**位置**：进度区下方

**实现方式**：前端模拟（根据进度映射）

**显示内容**：
```
正在分析：
✓ 正在提取图像...        (绿色，完成)
→ 分析颜色分布...        (金色闪烁，进行中)
○ 识别三圈结构...        (灰色，等待)
○ 生成解读报告...        (灰色，等待)
```

**进度映射规则**：
| 进度 | 日志状态 |
|------|----------|
| 0-20% | 第1项进行中，其他等待 |
| 20-50% | 第1项完成，第2项进行中 |
| 50-80% | 前2项完成，第3项进行中 |
| 80-100% | 前3项完成，第4项进行中 |

**样式**：
- 字体：12px
- 图标：✓ → ○（完成/进行/等待）
- 颜色：绿色(#48bb78)/金色(#d4a853)/灰色(#718096)

---

### 免费次数提示

**位置**：进度区下方

**样式**：
```
🎁 第 1/3 次免费解读
```

- 图标：礼物/星星
- 文字：12px，金色
- 提醒用户剩余免费次数

---

### 底部：五行小知识

**卡片样式**：
- 背景：米白色（#faf8f5）
- 圆角：16px
- 宽度：全宽-40px
- 内边距：16px

**内容**：
- 图标：💡
- 标题：「五行小知识」（14px，深灰）
- 内容：轮播展示
  - 「木生火，火生土，土生金，金生水，水生木」
  - 「内圈代表自我，中圈代表关系，外圈代表环境」
  - 「颜色与五行：绿木、红火、黄土、白金、蓝水」

**切换**：每5秒淡入淡出切换

---

## 跳转关系

```
上传页 → 点击「开始解读」→ 加载页 → 分析完成 → 报告结果页
    ↑                                        ↓
    └──────── 点击返回 ──────────────────────┘
              或点击关闭 → 落地页
```

---

## 分析阶段模拟（15-20秒）

| 时间 | 进度 | 显示文字 |
|------|------|----------|
| 0-3s | 0-20% | 正在提取图像... |
| 3-7s | 20-50% | 分析颜色分布... |
| 7-12s | 50-80% | 识别三圈结构... |
| 12-17s | 80-100% | 生成解读报告... |
| 17s+ | 100% | 即将完成... |

---

## 设计重点

1. **简化信息**
   - 只保留：进度条 + 百分比 + 当前步骤
   - 去掉详细分析日志（减少视觉负担）

2. **氛围延续**
   - 深色背景延续上传页风格
   - Logo动画营造等待中的仪式感

3. **免费提示**
   - 明确告知用户这是第几次免费
   - 建立「3次免费」的心理预期

---

## Figma Make 提示词

```
Create a mobile loading/analyzing page (375px) for "一镜一梳" mandala app.

Context: New page in existing project with upload page already designed. Use the same design system (colors, fonts from existing page).

Page Flow:
- Entry: User clicks "开始解读" on upload page
- Exit: Analysis complete (100%) → Auto-navigate to report result page
- Back: Click back arrow → Return to upload page
- Close: Click X → Return to landing page

Page Structure:

1. Top Navigation:
   - Back arrow (left)
   - Logo "一镜一梳" (center)
   - Close X button (right)

2. Core Visual Area:
   - Brand logo (150px) at center
   - Animation options:
     * Slow rotation (30s per cycle)
     * OR breathing scale (pulse effect)
     * OR golden glow surrounding
   - Subtle floating particles around logo
   - Title: "正在解读中..." (18px, white)
   - Subtitle: "AI正在分析您的曼陀罗画作" (14px, 70% opacity)

3. Progress Display (Simplified):
   - Progress bar: 280px width, 6px height, gold gradient fill
   - Percentage: "65%" (24px, gold, bold)
   - Current step: "分析颜色分布..." (14px, white)

4. Analysis Log (Simplified):
   - Title: "正在分析："
   - 4 log items with status icons:
     * ✓ 正在提取图像... (green, done)
     * → 分析颜色分布... (gold, blinking, active)
     * ○ 识别三圈结构... (gray, waiting)
     * ○ 生成解读报告... (gray, waiting)
   - Status changes based on progress (frontend simulation)

5. Free Trial Indicator:
   - Icon + text: "🎁 第 1/3 次免费解读"
   - Small text (12px, gold)
   - Position below progress area

5. Knowledge Card (Bottom):
   - Cream background (#faf8f5), rounded corners 16px
   - Icon + title: "💡 五行小知识" (14px)
   - Rotating tips (fade transition every 5s):
     * "木生火，火生土，土生金，金生水，水生木"
     * "内圈代表自我，中圈代表关系，外圈代表环境"
     * "颜色与五行：绿木、红火、黄土、白金、蓝水"

Create multiple frames showing progress: 0%, 25%, 50%, 75%, 100%

Animations:
- Logo: slow rotation or pulsing glow (3s loop)
- Progress bar: smooth fill animation
- Knowledge tips: fade transition every 5 seconds
- Floating particles (subtle, 3-5 particles)

Key Notes:
- NO user uploaded image (use brand logo instead)
- Simplified analysis log (4 items, frontend simulation based on progress)
- Show free trial count (1/3, 2/3, 3/3)
- Calming, professional atmosphere

Use existing design system from upload page. Mobile-first, 375px width.
```

---

*与上传页同一工程，沿用设计规范*
*页面宽度: 375px*
*分析时长: 15-20秒*
