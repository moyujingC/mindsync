# aimandala UI 重启执行方案

> 状态：draft
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-05
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-05-ui-restart-plan.md
> 当前主线分支：main
> 当前主工作区：/Users/xinran/Downloads/dev/mindsync

## 1. 重启结论

当前 `aimandala` 的 UI 工作不再继续沿用上一轮迁移结果补救，而改为：

**在干净 worktree 中，以原版 UI 源码为权威来源，重新实现 mobile-web。**

## 2. 为什么要重启

原因不是环境不一致，而是上一轮做法本身有问题：

1. 改动混在脏工作树里，无法高精度控制 UI 复刻
2. 页面壳层被重写过，导致视觉和交互节奏偏离原版
3. 继续在旧现场上修补，风险高于重新建立干净实现线

## 3. 当前执行原则

新线默认遵守下面五条规则：

1. 先复刻 UI，再整理内部结构
2. 原版源码优先于“理解后重写”
3. 截图只作为验收和纠偏，不作为主实现来源
4. 重构只发生在 UI 壳之下
5. 不在页面层继续堆平台语义

## 4. 当前权威来源

### 4.1 原版 UI 源码

当前确认原版 UI 的主要权威来源是：

1. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/App.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/App.tsx)
2. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/routes.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/routes.tsx)
3. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/LandingPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/LandingPage.tsx)
4. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/UploadPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/UploadPage.tsx)
5. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/LoadingPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/LoadingPage.tsx)
6. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/ReportPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/ReportPage.tsx)
7. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/ProReportPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/ProReportPage.tsx)
8. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/HistoryPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/HistoryPage.tsx)
9. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/index.css](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/index.css)
10. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/theme.css](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/theme.css)
11. [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/fonts.css](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/fonts.css)

### 4.2 验收参考

当前验收参考包括：

1. 用户提供的原版截图
2. 原版仓库中的页面 spec 和 wireframe
3. 当前仓库中与真实链路相关的实现约束

## 5. 新线保留的讨论输入

本线同步保留以下 notes：

1. [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/notes/2026-04-05-current-mvp-execution-brief.md](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/notes/2026-04-05-current-mvp-execution-brief.md)
2. [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/notes/2026-04-05-pro-report-chat-minimum-boundary.md](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/notes/2026-04-05-pro-report-chat-minimum-boundary.md)
3. [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/notes/2026-04-05-capability-registry-minimum-draft.md](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/notes/2026-04-05-capability-registry-minimum-draft.md)
4. [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/notes/2026-04-05-architecture-handoff.md](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/notes/2026-04-05-architecture-handoff.md)

这些文档只负责约束边界，不负责决定页面长相。

## 6. 当前不继承什么

新线默认不直接继承：

1. 上一轮重写后的 `mobile-web` 页面壳
2. 上一轮样式重写结果
3. 上一轮组件抽象方式

如果需要复用旧线代码，只允许复用：

1. 已确认正确的真实链路接线
2. 与 UI 外观无关的内部逻辑

## 7. 第一阶段页面顺序

第一阶段按下面顺序推进：

1. `Landing`
2. `Upload`
3. `Loading`
4. `Report`
5. `Pro Report`
6. `History`

每页都遵守：

1. 先恢复视觉壳
2. 再恢复状态文案和交互节奏
3. 最后接真实链路

## 8. 当前最重要的实施约束

### 8.1 允许重构的层

1. 状态管理
2. 数据流
3. 控制器
4. shared/application 层

### 8.2 不应先改的层

1. 页面 DOM 结构
2. 页面外层布局
3. 样式命名和关键数值
4. 页面切换节奏

## 9. 下一步直接执行项

下一轮进入新 worktree 后，直接开始：

1. 对照原版 `LandingPage.tsx` 和 `UploadPage.tsx`
2. 标记当前 `mobile-web` 中对应的落点文件
3. 建立“必须原样回搬”的视觉壳清单
4. 开始首批页面复刻

## 10. 首批文件映射

当前先按下面的映射关系推进：

### 10.1 原版来源

1. `Landing`
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/LandingPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/LandingPage.tsx)
2. `Upload`
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/UploadPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/UploadPage.tsx)
3. `Loading`
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/LoadingPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/LoadingPage.tsx)
4. `Report`
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/ReportPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/ReportPage.tsx)
5. `Pro Report`
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/ProReportPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/ProReportPage.tsx)
6. `History`
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/HistoryPage.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/components/HistoryPage.tsx)
7. 全局壳层和路由
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/App.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/App.tsx)
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/routes.tsx](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/app/routes.tsx)
8. 全局样式
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/index.css](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/index.css)
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/theme.css](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/theme.css)
   - [/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/fonts.css](/Users/xinran/Downloads/dev/ai-mandala/app/ui/src/styles/fonts.css)

### 10.2 新线落点

1. 全局入口与壳层
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/app.tsx](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/app.tsx)
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/browser-shell.tsx](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/browser-shell.tsx)
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/runtime.tsx](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/runtime.tsx)
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/routes.ts](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/routes.ts)
2. 页面壳
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/upload-page.tsx](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/upload-page.tsx)
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/report-page.tsx](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/report-page.tsx)
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/history-page.tsx](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/page-shells/history-page.tsx)
3. 页面状态
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/pages/upload-page.ts](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/pages/upload-page.ts)
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/pages/report-page.ts](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/pages/report-page.ts)
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/pages/history-page.ts](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/pages/history-page.ts)
4. 当前全局样式落点
   - [/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/styles.css](/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-ui-restart/projects/aimandala/toC/app/frontend/mobile-web/styles.css)

## 11. 第一批回搬范围

第一批只处理：

1. `Landing`
2. `Upload`
3. `Loading`

原因：

1. 这是最能验证“原版 UI 是否真的复刻回来”的三页
2. 也是最容易因为壳层重写而失真的三页
3. 先拿这三页校准方法，再进 `Report` 和 `History`
