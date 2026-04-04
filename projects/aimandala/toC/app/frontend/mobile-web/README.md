# Mobile Web

这里放 `一镜一梳` 当前手机端 Web 版的实现入口。

当前阶段这里还没有恢复页面层实现，但默认应按下面方式接共享层：

- 从 `../shared/types` 读取 DTO 和流程类型
- 从 `../shared/api` 调用当前 `V2` 后端接口
- 从 `../shared/core` 读取流程状态与纯函数

当前建议的接入顺序：

1. 上传页
   - 选择图片
   - 调用 `detect-circles`
2. 加载页
   - 调用 `createInterpretation`
   - 轮询 `status`
3. Lite 结果页
   - 调用 `report`
   - 渲染结构化 Lite 占位字段
4. 历史页
   - 调用用户历史列表
5. Upgrade 页
   - 当前只接兼容占位接口

当前不建议在这里直接复制旧仓库 `app/ui` 的整套结构，而是优先按共享层边界重组。

## 当前已提供的页面层骨架

当前这里已经补了一层不依赖具体框架的页面控制器：

- `controller.ts`
  - `bootstrapMobileWebFlow`
  - `runMobileWebLiteFlow`
  - `refreshMobileWebReport`
- `state.ts`
  - `MobileWebUploadDraft`
  - `toStartCreatePayload`
  - `getMobileWebPrimaryAction`
- `view-model.ts`
  - `createMobileWebPageViewModel`
- `examples/basic-flow-example.ts`
  - 最小接入示例
- `examples/*-page-shell.tsx`
  - 最小 React 风格页面壳示例
- `pages/`
  - 上传页、结果页、历史页的最小页面描述器

这意味着后续如果接 React 页面，可以直接：

1. 页面收集上传草稿
2. 转成 `StartCreatePayload`
3. 调 `runMobileWebLiteFlow`
4. 用返回的 `state` 和 `report` 渲染页面

这样页面层只负责 UI，不需要自己重新拼后端调用顺序。

## 当前推荐页面接线方式

建议页面层按下面的顺序接：

1. `bootstrapMobileWebFlow`
   - 初始化页面状态
2. `toStartCreatePayload`
   - 把上传表单草稿转成共享 payload
3. `runMobileWebLiteFlow`
   - 顺序完成检测、创建、状态、报告拉取
4. `getMobileWebPrimaryAction`
   - 决定当前主按钮文案
5. `createMobileWebPageViewModel`
   - 转成适合页面直接渲染的 title / subtitle / report 结构

如果需要更接近页面层的数据结构，还可以继续走：

6. `createUploadPageDescriptor`
7. `createReportPageDescriptor`
8. `createHistoryPageDescriptor`

这样真正的 React 组件只需要消费页面描述器，而不是自己从原始接口结果里抽字段。

## 最小页面壳说明

当前 `examples/` 里额外放了三种极简页面壳：

- `upload-page-shell.tsx`
- `report-page-shell.tsx`
- `history-page-shell.tsx`

它们不是正式 UI，只是为了说明：

- 页面如何消费 descriptor
- 页面如何尽量不直接依赖原始 API 返回
- 页面如何把业务决策留在共享层和 controller 中

## 当前正式入口骨架

除了示例文件，当前 `mobile-web/` 里也已经补了最小正式入口骨架：

- `routes.ts`
  - 当前 mobile-web 的最小路由定义
- `app-shell.tsx`
  - 最小应用壳
- `entry.tsx`
  - 把 controller、descriptor、view-model 串起来的入口示例

当前这些文件仍然是轻量骨架，不代表正式 UI 已完成，但已经足够作为后续 React 页面接入的落点。
