# Aimandala Frontend Design System

## 目标

这份文档定义 `aimandala` 当前前端的样式地基，用来约束 Web 与 miniapp 后续继续统一到组件层时的最小共识。

当前原则：

- 先统一 token 和语义，不强行统一同一份样式源码
- Web 保持原生 CSS
- miniapp 保持原生 `WXSS`
- 新增 UI 优先复用 token 和组件语义，不再继续扩张大段 inline style

## Web 样式入口

当前 Web 正式样式入口为：

- `mobile-web/styles/index.css`

当前导入层次为：

1. `../styles.css`
2. `tokens.css`
3. `foundation.css`
4. `utilities.css`
5. `components.css`
6. `pages/landing.css`
7. `pages/loading.css`
8. `pages/report-entry.css`
9. `pages/upload.css`
10. `pages/report-lite.css`
11. `pages/report-pro.css`
12. `pages/history.css`
13. `dev-shell.css`

说明：

- `../styles.css` 暂时作为兼容层保留，避免本轮一次性重写全部历史页面
- 新增和重构中的页面应优先把样式落到新分层目录，而不是继续向兼容层堆积
- 主链路迁移采用“迁一块、删一块旧样式”的方式，不接受新旧双写长期并存

## Token 分层

当前 token 采用两层：

- `core token`
  - 以 `--am-color-*`、`--am-font-*`、`--am-space-*`、`--am-radius-*` 等命名
  - 承载原始设计值
- `semantic token`
  - 以 `--am-surface-*`、`--am-text-*`、`--am-action-*`、`--am-border-*` 等命名
  - 承载语义用途

新增样式时，优先使用 semantic token；只有在 token 尚未覆盖时，才补充新的 core token。

## 组件语义

首批固定下来的组件语义包括：

- 主按钮：`am-primary-cta` / `mw-primary-button` / `am-upload-bottom-cta`
- 次按钮：`mw-secondary-button`
- 提示条：`mw-inline-banner`
- 页脚动作面板：`mw-footer-panel`
- 页面标题与大标题：优先复用 `am-font-display`

规则：

- 页面可覆盖布局，但不应随意改动组件的颜色、圆角、阴影和交互状态
- 动态几何值允许继续用 inline style，例如拖拽位移、缩放比例、实时计算宽度
- 静态视觉值应进入样式层，不应继续写入 JSX

## Inline Style 边界

当前允许保留 inline style 的场景：

- 运行时计算的 transform / translate / scale
- 进度条宽度、shimmer 位置等实时值
- 粒子、装饰点、圆盘几何等由代码动态决定的位置或尺寸

当前应迁出到样式层的场景：

- 静态颜色、排版、圆角、阴影、边框、背景
- 可由状态类表达的选中、聚焦、高亮
- 仅用于渲染纹理背景或 overlay 的样式对象

## 主链路迁移约束

- `Landing -> Upload -> Report Entry -> Loading -> Lite Report -> Pro Report` 已作为主链路渐进迁移目标
- 主链路页面新增样式必须优先进入 `mobile-web/styles/pages/*` 或 `components.css`
- `styles.css` 继续仅作为兼容层保留，不再接受主链路新视觉决策
- 迁移策略仍保持“迁一块、删一块旧规则”，但仅删除已确认没有 JSX 调用方的兼容样式
- 主链页面的品牌纹理统一通过 `--am-pattern-image` 这类 CSS variable 注入到页面或区块容器，再由 CSS 类消费；不要在 JSX 中继续写静态 `backgroundImage`
- `SharedReportEntrySelectionPage` 使用 `heroPatternClassName` / `heroPatternStyle` 承载 hero 纹理，不再通过 `heroBackground` 塞纯视觉节点

## Pro Report 约束

- `Pro Report` 的页面专属样式统一进入 `mobile-web/styles/pages/report-pro.css`
- `pro-report-page.tsx` 中只保留类名、条件类和少量运行时几何值，例如三圈半径尺寸
- 聊天弹层、聊天气泡、快捷提问 chips、输入区归类为页面级子模块，先留在 `report-pro.css`
- 只有当某个 `Pro` 子模块至少被两个位置复用时，才提升到 `components.css`

## History 回看链路约束

- `History` 与 `History Detail` 的页面专属样式统一进入 `mobile-web/styles/pages/history.css`
- `mw-card`、`mw-meta`、`mw-progress` 等跨页面稳定基础样式进入 `components.css`
- History 链路允许保留进度条宽度这类运行时 inline style，但筛选、状态卡、toolbar、hero 与 badge 的静态视觉必须进入 CSS 层

## Miniapp 映射

miniapp 的 token 映射说明见：

- `miniapp-native/DESIGN_TOKEN_MAPPING.md`

当前 miniapp 先做语义对齐，不做自动生成或完全共用样式代码。
