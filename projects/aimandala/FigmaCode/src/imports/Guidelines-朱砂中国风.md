# 一镜一梳设计规范 - 朱砂中国风

## 色彩系统

### 主色调
- **Primary/Cinnabar**: #C45C4A - 朱砂红，用于选中状态
- **Secondary/Gold**: #D4AF37 - 鎏金，用于强调和圆环
- **Accent/Jade**: #4A9B8C - 青玉，用于辅助点缀

### 背景色
- **Background/Dark-Start**: #4A2D2D - 深红，渐变起点（宫墙色）
- **Background/Dark-End**: #261212 - 更深红，渐变终点
- **Surface/Paper**: #F5F0E8 - 宣纸米白，卡片背景
- **Surface/White**: #FFFFFF - 纯白，用于输入框

### 文字色
- **Text/Primary**: #2D2D2D - 墨色，主要文字
- **Text/Muted**: #8C7B6C - 灰褐，次要文字
- **Text/OnDark**: #F5F0E8 - 深色背景上的文字

## 字体规范

- **标题**: Noto Serif SC / 18px / Medium - 衬线体营造书卷气
- **正文**: Noto Sans SC / 14px / Regular
- **辅助**: Noto Sans SC / 12px / Regular
- **按钮**: Noto Sans SC / 16px / Medium

## 组件规范

### 上传圆环
- 尺寸: 280px
- 边框: 2px dashed #D4AF37（金色虚线）
- **发光效果**: Layer blur 20px, color #D4AF37 at 30%
- 中心图标: 相机图标，金色

### 滑块
- Track: 4px 高度，圆角
- Filled: #C45C4A (朱砂红)
- Thumb: 20px 圆形，宣纸白 #F5F0E8，阴影 0 2px 8px rgba(0,0,0,0.15)
- 数值标签: 滑块右侧，14px，#C45C4A

### 主题按钮
- 尺寸: 72px × 80px
- 圆角: 12px
- 默认: 宣纸白底 #F5F0E8，浅褐边框
- **选中**: #C45C4A 背景，米白文字，scale(1.05)
- 图标: 32px，线性风格

### 输入框
- 高度: 48px
- 圆角: 12px
- 背景: #FFFFFF（纯白）
- 边框: 1px #D4C4B0
- **聚焦**: 2px solid #C45C4A
- 右侧图标: 毛笔/铅笔图标

### 主按钮
- 高度: 52px
- 圆角: 24px (pill)
- 背景: 金色渐变 #D4AF37 → #B8962F
- 阴影: 0 4px 12px rgba(196,92,74,0.3)
- 文字: "开始解读" + 印章风格图标

## 布局规范

### 页面结构
- 设备: iPhone 14 / 375×812px
- Hero 区域: 55% 高度，深红渐变（宫墙感）
- 内容卡片: 宣纸米白 #F5F0E8，圆角 24px 上边缘
- 底部面板: 固定，宣纸白背景

### 间距
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px

## 效果规范

### 阴影
- 卡片阴影: Drop shadow, y: -4, blur: 20, color: rgba(0,0,0,0.1)
- 按钮阴影: 0 4px 12px rgba(196,92,74,0.3)

### 发光效果
- 圆环发光: Layer blur 20px, #D4AF37 at 30%
- 选中发光: 0 0 20px rgba(196,92,74,0.4)

### 纹理（可选）
- 卡片背景可添加 subtle 宣纸纹理
- 透明度 5-10%，不干扰内容

## 交互状态

### 按钮
- 默认: 宣纸白底，浅褐边框
- Hover: 背景 #EDE8E0
- 选中: #C45C4A 背景，米白文字，放大 1.05
- Pressed: 背景加深 #A84C3C

### 输入框
- 默认: 浅褐边框
- 聚焦: 朱砂红边框 + 外发光
- 已填: 墨黑文字显示

## 设计原则

1. **东方美学**: 深红+鎏金营造宫墙氛围
2. **书卷气息**: 宣纸米白替代纯白，更有温度
3. **克制用色**: 朱砂红点睛，不滥用
4. **文化符号**: 印章、毛笔等元素点缀
