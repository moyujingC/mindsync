# Figma Make Prompt - 上传页

> 适用于 Figma Make (figma.com/make)
> 生成 Figma 设计稿

---

## 核心提示

Create a mobile app upload screen design for "一镜一梳" mandala interpretation app. Design for iOS mobile (375px width) with elegant Chinese-inspired aesthetic.

---

## 整体布局结构

```
┌─────────────────────────────────────────┐
│ ← 一镜一梳          [Top Navigation]    │
├─────────────────────────────────────────┤
│                                         │
│    [DARK GRADIENT BACKGROUND AREA]      │
│    - Gradient: #2D4A3E → #1A2F26        │
│                                         │
│         ╭───────────────╮              │
│         │   📷          │              │
│         │  点击上传或拍照 │              │
│         │  上传您的曼陀罗 │              │
│         ╰───────────────╯              │
│         Golden dashed ring (280px)      │
│                                         │
│    内环半径             --              │
│    ═════●══════════════════             │
│                                         │
│    中环半径             --              │
│    ═══════════●═══════════              │
│                                         │
│    拖动调节圆环位置，帮助AI更精准解读      │
│                                         │
├─────────────────────────────────────────┤  ← White card starts
│                                         │
│    选择解读主题 *                        │
│    [Horizontal scrollable buttons]      │
│                                         │
│   ┌────┬────┬────┬────┬────┬────┬────┬────┐  →  │
│   │ ⭐ │ 👨 │ 👩 │ 💕 │ 👶 │ 💰 │ ❤️  │ 🌱 │      │
│   │全面│父亲│母亲│亲密│亲子│财富│身体│个人│      │
│   │解读│关系│关系│关系│关系│事业│健康│成长│      │
│   └────┴────┴────┴────┴────┴────┴────┴────┘      │
│      ●  ○  ○  ○  ○  ○  ○  ○                       │
│                                         │
│   ┌─────────────────────────┐          │
│   │ 记录绘画前设定的意图      │          │
│   │                    ✏️   │          │
│   └─────────────────────────┘          │
│                                         │
│   ┌─────────────────────────┐          │
│   │ 记录绘画时的感受          │          │
│   │                    ✏️    │
│   └─────────────────────────┘          │
│                                         │
├─────────────────────────────────────────┤  ← Fixed bottom panel
│                                         │
│   ┌─────────────────────────┐          │
│   │        开始解读          │          │
│   └─────────────────────────┘          │
│                                         │
│   🔒 上传即表示您同意 [隐私政策]         │
│      画作将被加密存储并仅用于解读         │
│                                         │
└─────────────────────────────────────────┘
```

---

## 平台特定要求（Figma Make）

### 设计系统规范

**Color Palette (创建为 Figma Variables)**
```
Primary/Jade: #4A9B8C
Secondary/Blue: #5FB3C3
Accent/Gold: #D4AF37
Background/Dark-Start: #2D4A3E
Background/Dark-End: #1A2F26
Surface/White: #FFFFFF
Text/Primary: #2D3748
Text/Muted: #718096
Border/Light: #E2E8F0
```

**Typography (创建为 Text Styles)**
```
Heading: Noto Serif SC / 18px / Medium
Body: Noto Sans SC / 14px / Regular
Caption: Noto Sans SC / 12px / Regular
Button: Noto Sans SC / 16px / Medium
```

**Spacing Scale (创建为 Spacing Tokens)**
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
```

### 组件库（创建为 Figma Components）

**1. Upload Ring**
- Frame: 280×280px
- Border: 2px dashed, color #D4AF37
- Center: Camera icon + text
- Variants: Empty / Uploaded (with image fill)

**2. Slider Control**
- Track: Full width, 4px height, rounded
- Thumb: 20px circle, pearl color #F5F5DC
- Label: Left text + Right percentage

**3. Theme Button**
- Size: 72×80px
- Border radius: 8px
- Structure: Icon (32px) + Text (2 lines)
- Variants: Default / Selected
- Icons: Use emoji or simple line icons

**4. Text Input**
- Height: 48px
- Border: 1px #E2E8F0, radius 12px
- Padding: 16px horizontal
- Right icon: Pencil or Chevron

**5. Primary Button**
- Height: 52px
- Border radius: 24px (pill)
- Color: Gold gradient or solid
- Text: "开始解读" with book icon

### 页面结构（Figma Layer Organization）

```
📁 Upload Page (Frame: 375×812px)
├── 📁 Navigation Bar (Fixed top)
│   ├── Back Button
│   └── Title "一镜一梳"
│
├── 📁 Hero Section (Fixed, ~55% height)
│   ├── Background (Gradient fill)
│   ├── 📁 Upload Ring Component
│   ├── 📁 Sliders (2 instances)
│   └── Hint Text
│
├── 📁 Content Card (Auto layout, scrollable)
│   ├── Title "选择解读主题 *"
│   ├── 📁 Theme Buttons (Single row, horizontal scroll)
│   │   ├── Button: 全面解读 (Selected)
│   │   ├── Button: 父亲关系
│   │   ├── Button: 母亲关系
│   │   ├── Button: 亲密关系
│   │   ├── Button: 亲子关系
│   │   ├── Button: 财富事业
│   │   ├── Button: 身心健康
│   │   └── Button: 个人成长
│   ├── Pagination Dots (8 dots)
│   ├── 📁 Input Field 1
│   └── 📁 Input Field 2
│
└── 📁 Bottom Panel (Fixed bottom)
    ├── Primary Button Instance
    └── Privacy Text
```

### 设计规格

**Frame Setup**
- Device: iPhone 14 / 375×812px
- Layout grid: 4px baseline
- Constraints: Scale for responsiveness

**Effects**
- Upload ring glow: Layer blur 20px, color #D4AF37 at 30%
- Card shadow: Drop shadow, y: -4, blur: 20, color: rgba(0,0,0,0.15)
- Button selected: Inner shadow or solid fill

**Auto Layout Settings**
- Theme buttons: Horizontal auto layout, gap: 12px
- Content card: Vertical auto layout, gap: 16px, padding: 24px
- Bottom panel: Vertical auto layout, centered, padding: 16px

### 交互状态（Create as Variants）

**Upload Area States**
- Empty: Dashed ring, camera icon
- Hover: Ring glow increases
- Uploaded: Image fill, dashed ring becomes solid with three colored circles overlaid

**Slider States**
- Disabled: Track at 30% opacity, thumb hidden
- Active: Full opacity, thumb visible and draggable

**Button States**
- Default: White bg, gray text
- Hover: Light gray bg
- Selected: Jade green bg, white text, checkmark icon
- Pressed: Darker shade

**Input States**
- Default: Gray border
- Focus: Jade green border
- Filled: Text appears

### 设计交付物

**需要创建的 Figma 文件结构**
```
📄 一镜一梳 - 上传页
├── 🎨 Colors (Variables)
├── 🔤 Typography (Text Styles)
├── 📐 Spacing (Tokens)
├── 🧩 Components
│   ├── Upload Ring
│   ├── Slider
│   ├── Theme Button
│   ├── Text Input
│   └── Primary Button
└── 📱 Pages
    ├── Upload Page (Default state)
    ├── Upload Page (Image uploaded)
    └── Upload Page (Theme selected)
```

---

## 导出后操作

1. **设计审查**: Check all states and interactions
2. **开发者交接**:
   - Export color variables as CSS
   - Export text styles as CSS
   - Export components as SVG/PNG
   - Use Figma Dev Mode for specs
3. **原型演示**: Create interactive prototype with transitions
4. **设计系统文档**: Document usage guidelines

---

## 与开发对接

**Design → Code Handoff**
- Use Figma Dev Mode for developer inspection
- Provide redline specs for critical measurements
- Annotate interaction behaviors
- Prepare asset exports (1x, 2x, 3x)

**Developer Notes**
- This is a design reference, not production code
- Developers will implement using React/Next.js
- Animations should reference Framer Motion
- Responsive behavior: Scale proportionally up to 480px max-width

---

*文档版本: 1.0*
*适用平台: Figma Make (figma.com/make)*
*输出类型: Figma Design File*
