# 一镜一梳 To C 前端迁移基线交付记录

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-04-frontend-baseline-delivery.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/ToC-MVP-技术方案.md

## 1. 本轮交付目标

这一轮前端迁移不直接恢复旧仓库 UI，而是先把 To C 前端的共享层与渠道层骨架建立出来，让后续 mobile-web 接入和未来 miniapp / native-app 扩展都有明确落点。

## 2. 已完成交付

### 2.1 共享层

已建立：

- `toC/app/frontend/shared/types`
- `toC/app/frontend/shared/api`
- `toC/app/frontend/shared/core`

当前覆盖：

- `V2` DTO 镜像
- 通用请求封装
- `detect-circles / interpretations / status / report / upgrade / pricing` service
- 最小流程状态与纯函数

### 2.2 mobile-web

已建立：

- controller
- state adapter
- view-model
- page descriptors
- page shells
- loaders
- route planner
- host entry
- runtime

当前意义：

- 已经具备“route -> loader -> app props -> app shell -> page shell”这一整条装配链
- 还没有正式 UI，但已经能作为真实 React 页面接入前的稳定骨架

### 2.3 其他渠道

已建立正式入口与说明：

- `toC/app/frontend/miniapp`
- `toC/app/frontend/native-app`

当前仍然只是占位层，但目录语义已经固定。

### 2.4 前端工作区配置

已建立：

- `toC/app/frontend/package.json`
- `toC/app/frontend/tsconfig.json`
- `toC/app/frontend/mobile-web/main.tsx`

当前前端目录已经是一个明确的 TypeScript 工作区入口，而不只是文档容器。

## 3. 当前边界

当前仍未交付：

- 真实 mobile-web 页面 UI
- 真实文件上传交互
- 真实支付与登录流程
- miniapp / native-app 平台能力适配
- 具体运行壳绑定（Vite / Next 等）

## 4. 当前价值

这轮交付解决的核心问题不是“页面好不好看”，而是：

1. 前端不再只有口头上的多端规划，而是已经有明确的 shared / channel 落位
2. mobile-web 已有足够细的骨架，不会在开始写页面时再次把业务逻辑散落到组件里
3. miniapp 与 native-app 后续扩展时，不需要重新决定目录边界

## 5. 下一步建议

后续优先级建议：

1. 选定一个具体运行壳来承接 mobile-web
2. 把 upload / loading / report / history 做成真实页面
3. 用当前 shared api 接上已迁入的后端 `V2` 最小接口
4. 等真实 Lite 链路替换占位报告后，再逐步收口页面文案和展示结构
