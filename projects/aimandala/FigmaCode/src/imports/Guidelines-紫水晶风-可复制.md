# 一镜一梳设计规范 - 紫水晶神秘风

## 色彩系统

### 主色调
- **Primary/Purple**: #7C5C8C - 紫水晶，用于选中状态、主按钮
- **Secondary/Lavender**: #A88CB8 - 薰衣草，用于次级强调
- **Accent/Gold**: #D4AF37 - 金色，用于圆环、关键图标

### 背景色
- **Background/Dark-Start**: #3D2D4A - 深紫，渐变起点
- **Background/Dark-End**: #1A1226 - 更深紫，渐变终点
- **Surface/White**: #FFFFFF - 卡片背景

### 文字色
- **Text/Primary**: #2D3748 - 主要文字
- **Text/Muted**: #718096 - 次要文字
- **Text/OnDark**: #FFFFFF - 深色背景上的文字

## 字体规范

- **标题**: Noto Serif SC / 18px / Medium
- **正文**: Noto Sans SC / 14px / Regular
- **辅助**: Noto Sans SC / 12px / Regular
- **按钮**: Noto Sans SC / 16px / Medium

## 组件规范

### 上传圆环
- 尺寸: 280px
- 边框: 2px dashed #D4AF37
- **发光效果**: Layer blur 20px, color #D4AF37 at 30%
- 中心图标: 相机图标，金色

### 滑块
- Track: 4px 高度，圆角
- Filled: #7C5C8C (主色)
- Thumb: 20px 圆形，白色，阴影 0 2px 8px rgba(0,0,0,0.15)
- 数值标签: 滑块右侧，14px，#7C5C8C

### 主题按钮
- 尺寸: 72px × 80px
- 圆角: 12px
- 默认: 白底，灰色边框
- **选中**: #7C5C8C 背景，白色文字，scale(1.05)
- 图标: 32px，线性风格

### 输入框
- 高度: 48px
- 圆角: 12px
- 边框: 1px #E2E8F0
- **聚焦**: 2px solid #7C5C8C
- 右侧图标: 铅笔图标

### 主按钮
- 高度: 52px
- 圆角: 24px (pill)
- 背景: 金色渐变 #D4AF37 → #C4A030
- 阴影: 0 4px 12px rgba(212,175,55,0.3)
- 文字: "开始解读" + 书本图标

## 布局规范

### 页面结构
- 设备: iPhone 14 / 375×812px
- Hero 区域: 55% 高度，深紫渐变
- 内容卡片: 白色，圆角 24px 上边缘
- 底部面板: 固定，白色背景

### 间距
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px

## 效果规范

### 阴影
- 卡片阴影: Drop shadow, y: -4, blur: 20, color: rgba(0,0,0,0.08)
- 按钮阴影: 0 4px 12px rgba(124,92,140,0.3)

### 发光效果
- 圆环发光: Layer blur 20px, #D4AF37 at 30%
- 选中发光: 0 0 20px rgba(124,92,140,0.4)

## 交互状态

### 按钮
- 默认: 白底，灰色边框
- Hover: 背景 #F7F7F7
- 选中: #7C5C8C 背景，白色文字，放大 1.05
- Pressed: 背景加深 #6A4F7A

### 输入框
- 默认: 灰色边框
- 聚焦: 紫色边框 + 外发光
- 已填: 文字显示

## 设计原则

1. **神秘感**: 深紫渐变背景营造灵性氛围
2. **高级感**: 金色点缀提升品质感
3. **清晰度**: 白色卡片确保内容可读
4. **一致性**: 紫色作为主色贯穿始终
