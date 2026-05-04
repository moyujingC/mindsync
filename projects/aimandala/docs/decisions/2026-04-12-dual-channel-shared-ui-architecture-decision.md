# 一镜一梳 To C 双端共享 UI 架构决策

> 状态：current
> 版本：0.1.0
> owner：Architect
> last_updated：2026-04-18
> source_of_truth：projects/aimandala/docs/decisions/2026-04-12-dual-channel-shared-ui-architecture-decision.md
> 项目：aimandala
> 阶段：decision
> depends_on：projects/aimandala/docs/specs/ToC-MVP-产品规范.md
> depends_on：projects/aimandala/docs/architecture/ToC-MVP-技术方案.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 决策结论

当前采用：

- `shared/types`
- `shared/core`
- `shared/design-system`
- `shared/ui`
- `mobile-web shell`
- `miniapp shell`

的六层结构。

## 2. 当前明确采用

1. 尽早共享 UI
2. 不推倒当前 `mobile-web + Vite + React` 主线
3. 不在这一轮引入新的跨端 UI 框架
4. 用“共享展示主体 + 分端平台壳”代替“强行 100% 共享页面代码”

## 3. 当前明确不采用

1. 不把上传、支付、登录、分享抽进共享 UI
2. 不为了追求纯粹跨端而重做现有 Web 页面体系
3. 不把小程序平台细节写回 shared 层

## 4. 工作树决策

这条线属于较大改造，当前采用：

- 独立 worktree
- 专用 branch：`codex/aimandala-dual-channel-ui`

原因：

1. 当前 `mobile-web` 已是正式主线
2. 这轮会同时改 shared、web、miniapp 与 artifact
3. 需要允许主工作树继续做正式主线小改与线上问题处理

## 5. 当前允许的折中

为避免首轮抽取成本过高，当前共享 UI 允许保留部分过渡性 class contract。

也就是：

1. 组件逻辑先进入 `shared/ui`
2. 样式语义逐步从 `mobile-web` 私有 class 迁到更中性的 shared 命名

只要组件边界和 props 已经被抽离，就视为本轮有效进展。
