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

这意味着后续如果接 React 页面，可以直接：

1. 页面收集上传草稿
2. 转成 `StartCreatePayload`
3. 调 `runMobileWebLiteFlow`
4. 用返回的 `state` 和 `report` 渲染页面

这样页面层只负责 UI，不需要自己重新拼后端调用顺序。
