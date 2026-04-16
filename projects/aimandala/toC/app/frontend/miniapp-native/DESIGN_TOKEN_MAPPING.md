# Aimandala Miniapp Token Mapping

## 目标

这份文档定义 `mobile-web` 设计 token 到 `miniapp-native` 的手工映射规则，帮助后续把小程序端逐步拉回同一套设计语言。

当前默认原则：

- Web CSS token 是设计语义真理源
- `shared/design-system/tokens.ts` 是跨端程序化对照源
- miniapp 本轮继续手工映射，不做自动编译
- `miniapp-native/styles/tokens.wxss` 是 miniapp 当前代码侧 token 入口

## 可直接映射到 WXSS 的 token

- 颜色
  - `--am-surface-primary`
  - `--am-text-primary`
  - `--am-text-secondary`
  - `--am-text-accent`
  - `--am-surface-error`
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

## Miniapp 首轮对照表

| Miniapp 文件 | 选择器/语义 | 当前值 | 对应 Web semantic token | 是否可直接落到 WXSS | 降级说明 |
| --- | --- | --- | --- | --- | --- |
| `app.wxss` | `page` 背景 | `#f6f0e8` | `--am-surface-primary` | 是 | 小程序直接用纯色浅底，不保留 Web 背景纹理 |
| `app.wxss` | `page` 主文字 | `#2f2620` | `--am-text-primary` | 是 | 当前可直接映射为主正文色 |
| `pages/runtime/index.wxss` | `.runtime-page` 背景渐变起点 | `#f6f0e8` | `--am-surface-primary` | 是 | 允许保留简单线性渐变 |
| `pages/runtime/index.wxss` | `.runtime-page` 背景渐变终点 | `#f1e6d6` | `--am-surface-primary` 的浅深变化 | 是 | 视作同一页面 surface 的轻微层次变化 |
| `pages/runtime/index.wxss` | `.runtime-page__state` 主文字 | `#2f2620` | `--am-text-primary` | 是 | 对应运行态正文与标题容器文字色 |
| `pages/runtime/index.wxss` | `.runtime-page__state--error` 错误文字 | `#7a3023` | `--am-color-danger-600` / `status.danger` | 是 | miniapp 直接用纯色错误态，不叠加 Web 错误面板背景 |
| `pages/runtime/index.wxss` | `.runtime-page__title` 标题字号/字重 | `40rpx` / `600` | `--am-text-xl` + display/body 标题语义 | 部分 | WXSS 保留现有字号，语义上归入标题层级 |
| `pages/runtime/index.wxss` | `.runtime-page__copy` 正文字号/行高 | `28rpx` / `1.6` | `--am-text-md` + `--am-leading-body` | 部分 | rpx 与 px 不直接等值，按正文层级手工映射 |

## 当前推荐映射

- Web `surface-primary` -> miniapp `page` / runtime 浅底背景
- Web `text-primary` -> miniapp 标题与正文
- Web `text-secondary` -> miniapp 说明文案
- Web `text-accent` -> miniapp 品牌强调文案
- Web `action-primary-bg` -> miniapp 主按钮渐变
- Web `action-primary-text` -> miniapp 主按钮文字
- Web `border-soft` -> miniapp 卡片、输入框、提示块边框
- Web `status.danger` -> miniapp 错误态文字和错误提示

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

## 当前代码侧落地规则

- `app.wxss` 与 `pages/runtime/index.wxss` 现已直接消费 `styles/tokens.wxss` 中的 `--am-*` 变量
- `app.json` 中的 `navigationBarBackgroundColor` / `backgroundColor` 仍保持硬编码 `#f6f0e8`
  - 这是微信配置 JSON 不支持 `var()` 的平台限制
  - 语义上仍对应 `--am-surface-primary`
- miniapp 后续新增样式应优先补 token 变量，再写页面规则；不要重新发明一套只存在于小程序端的颜色命名
