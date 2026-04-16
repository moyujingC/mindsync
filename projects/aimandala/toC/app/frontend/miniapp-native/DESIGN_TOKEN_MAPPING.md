# Aimandala Miniapp Token Mapping

## 目标

这份文档定义 `mobile-web` 设计 token 到 `miniapp-native` 的手工映射规则，帮助后续把小程序端逐步拉回同一套设计语言。

## 可直接映射到 WXSS 的 token

- 颜色
  - `--am-surface-primary` -> 页面浅色背景
  - `--am-text-primary` -> 主文字
  - `--am-text-secondary` -> 次级说明文字
  - `--am-text-accent` -> 品牌强调文字
  - `--am-surface-success` -> 成功态背景
  - `--am-surface-error` -> 错误态背景
- 字体
  - `--am-font-body`
  - `--am-font-display`
- 尺寸
  - `--am-text-sm` / `--am-text-md` / `--am-text-lg`
  - `--am-space-*`
  - `--am-radius-*`

## 需要降级的效果

- `backdrop-filter`
  - miniapp 默认不用，改为纯色或高透明度纯色背景
- 复杂多层阴影
  - 保留一层轻阴影，避免发灰和发脏
- 大面积渐变叠加 + pattern overlay
  - 保留主渐变，减少额外纹理层
- glow / blur / filter
  - 优先用纯色 halo 或直接移除

## 当前推荐映射

- Web `surface-primary` -> miniapp `page` 背景
- Web `text-primary` -> miniapp 标题与正文
- Web `text-secondary` -> miniapp 说明文案
- Web `action-primary-bg` -> miniapp 主按钮渐变
- Web `action-primary-text` -> miniapp 主按钮文字
- Web `border-soft` -> miniapp 卡片、输入框、提示块边框

## 当前已覆盖的小程序样式语义

当前小程序端已有的：

- `app.wxss`
  - 页面基础背景色
  - 页面基础文字色
- `pages/runtime/index.wxss`
  - 运行态背景
  - 标题与正文层级
  - 错误态文字色

这些语义已能映射到当前 token 命名，不需要再单独发明一套颜色语言。
