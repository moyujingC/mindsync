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
  - `pollMobileWebReportUntilReady`
- `state.ts`
  - `MobileWebUploadDraft`
  - `MobileWebUploadAssetRef`
  - `toStartCreatePayload`
  - `getMobileWebPrimaryAction`
  - `mergeMobileWebUploadDraft`
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
   - 顺序完成检测、创建，并在可读取时返回状态 / 报告
4. `pollMobileWebReportUntilReady`
   - 在 `loading` 阶段受控轮询 `status`
   - 直到报告就绪后再进入 `report`
5. `getMobileWebPrimaryAction`
   - 决定当前主按钮文案
6. `createMobileWebPageViewModel`
   - 转成适合页面直接渲染的 title / subtitle / report 结构

如果需要更接近页面层的数据结构，还可以继续走：

7. `createUploadPageDescriptor`
8. `createReportPageDescriptor`
9. `createHistoryPageDescriptor`

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

## 当前页面壳落点

除了示例和入口文件，当前还补了可直接挂路由的页面壳：

- `page-shells/upload-page.tsx`
- `page-shells/report-page.tsx`
- `page-shells/history-page.tsx`

这些页面壳默认只做三件事：

- 从 descriptor / state 读取数据
- 交给 `MobileWebAppShell` 承载
- 保持页面层尽量薄，不重新实现业务流程

## 当前应用装配点

现在还补了一个 `app.tsx`：

- 根据 `route` 选择 upload / report / history 页面壳
- 作为后续真实路由框架接入前的最小宿主层

这样后面如果接 React Router 或其他路由层，优先把真实路由结果映射到 `MobileWebApp`，而不是在页面里重新分发业务状态。

## 当前页面 loader

现在还新增了一层 `loaders.ts`，把页面壳真正接到 controller 上：

- `loadUploadPage`
- `loadLiteReportPage`
- `loadExistingReportPage`
- `loadHistoryPage`

这样后续不管是 React Router、Next App Router，还是别的页面框架，都可以先把 loader 接进去，再把结果交给页面壳渲染。

## 当前路由装配器

现在还补了 `router-plan.ts`，用于把：

- route id
- route params
- loader
- app props

串成同一条装配链。

当前推荐的接线顺序是：

1. 路由层产出 `route + params`
2. `resolveMobileWebRouteProps`
3. 把返回结果交给 `MobileWebApp`

这样后续接真实框架时，路由层和页面层之间会更干净。

## 当前宿主适配入口

现在还补了 `host.tsx`：

- `renderMobileWebRoute`
  - 输入 `route + params`
  - 内部调用 `resolveMobileWebRouteProps`
  - 最终返回 `MobileWebApp`

这意味着外部宿主框架如果要接这套骨架，最小只需要调用一个入口函数。

## 当前运行时层

现在还补了 `runtime.tsx`：

- `useMobileWebRouteLoader`
  - 负责异步 route props 加载
- `MobileWebRuntime`
  - 负责 loading / error / app 渲染分发

这样如果后面接 React 宿主，可以直接先挂 `MobileWebRuntime`，不需要每个页面自己写一套异步加载状态管理。

## 当前浏览器开发壳

现在已经补上一个最小浏览器宿主层：

- `../index.html`
- `../vite.config.ts`
- `browser-entry.tsx`
- `browser-shell.tsx`
- `styles.css`

当前这个壳的目标很明确：

- 用 `Vite` 把 `MobileWebRuntime` 正式挂到浏览器里
- 提供一个开发辅助层，用来切换 `upload / loading / report / history / upgrade`
- 保持 `runtime -> router-plan -> app` 这条装配链不变

它不是正式 UI，也不是最终路由方案，但已经足够承担：

1. 本地跑通 mobile-web 骨架
2. 继续往上传页、结果页、历史页长真实组件
3. 在不改共享层边界的前提下继续接后端接口

当前本地启动方式：

1. 在 `frontend/` 目录安装依赖
2. 运行 `npm run dev:mobile-web`
3. 浏览器打开 `Vite` 提供的本地地址

当前开发壳还补了一层本地预览模式：

- 默认开启
- 不请求后端
- 可以直接切换 `upload / loading / report / history / upgrade`

## 当前上传对象状态约定

上传页和运行时现在统一通过 `MobileWebUploadDraft.uploadAsset` 保存已解析的上传对象信息，而不是把：

- `uploadedImagePath`
- `uploadedStorageBackend`
- `uploadedStorageKey`
- `uploadedImageUrl`

分散在草稿顶层。

当前推荐页面层只通过下面几个 helper 读写这段状态：

- `toMobileWebUploadAssetRef`
- `getDraftUploadImageResponse`
- `mergeMobileWebUploadDraft`
- `getDraftRuntimeImagePath`

这样 upload / loading / report 三页看到的是同一份“运行时图片路径 + 对象标识”语义，也能减少 preview/runtime 两套宿主里的重复拷贝。

另外，当前 `router-plan.ts` 也已经允许在：

- `loading`
- `report`
- `history`
- `upgrade`

这些路由输入里显式携带 `uploadDraft`。

这样后续如果接真实路由框架，就不必完全依赖宿主组件本地 state 才能把上传上下文从 upload 传到 report / history；运行时可以沿路由装配链继续保留这份草稿。
- 用固定 fixture 支撑页面结构开发
- 开发辅助层默认可折叠，不作为正式产品界面的一部分
- 手机页面内会直接标明当前是“本地预览模式”还是“联调运行时”
- history 页会额外标明当前展示的是“真实记录”还是“占位记录”
- history 列表项现在会在打开记录时进入受控禁用态，并提示当前正在刷新真实状态后再跳转到 `loading / report`
- history descriptor 现在会把原始 `status / generation_stage / progress` 收口成更接近用户语义的状态标签、阶段说明与可读时间

当需要真实联调时，再关闭预览模式，切回 `MobileWebRuntime` 走当前 loader 与后端接口。

## 当前交互基线

当前 `mobile-web` 已经形成一条更清晰的预览期页面节奏：

1. 上传页
   - 先选图
   - 支持浏览器原生选图
   - 支持本地缩略预览
   - 支持模拟三圈检测结果
   - 只有检测完成后才能继续
2. loading 页
   - 已有进度条和阶段列表
   - 已开始按受控节奏自动轮询真实 `status`
   - 可以继续手动刷新生成进度
   - 也可以先返回上传页
3. report 页
   - 已有结构化 Lite 内容卡
   - 可以进入历史页
   - 也可以重新上传
4. history 页
   - 已有摘要区
   - 已有 `全部 / 可查看 / 生成中` 筛选
    - 已支持真实历史优先加载与回退说明
    - runtime 下切换筛选时已开始回传真实筛选参数重新拉取列表
    - shared API / route / backend 现在已开始统一走 `historyQuery(filter / limit / theme)` 语义
    - 页面层已开始露出主题筛选入口，并与 `historyQuery.theme` 对齐
    - 页面层已开始露出显示数量切换，并与 `historyQuery.limit` 对齐
    - 列表项已开始支持直接打开报告或查看当前生成进度

当前这些动作不再是纯占位：

- 上传页的 `detect-circles` 已开始支持真实接口触发
- 浏览器原生选图已开始先换成后端本地临时 `image_path`
- 上传页摘要区已开始展示 `storage_backend / storage_key / image_url`
- 预览壳里的 Lite 主路径已开始尝试真实 `create + status + report`
- loading 页已开始在真实 `status` 未完成时自动轮询
- history 页已开始优先承接真实记录
- history 页的 `全部 / 可查看 / 生成中` 已开始向真实接口回传筛选参数
- history 列表查询已开始统一收口到 `historyQuery`，为后续扩展 `theme / limit` 留出稳定接口面
- history 页主题筛选已开始进入页面层，不再只是后端预留字段
- history 页显示数量切换已开始进入页面层，不再只是查询参数占位
- history 列表项已开始能回到 report / loading，而不再只是停在信息展示
- 正式 `MobileWebRuntime` 已补上与预览壳一致的 loading 自动推进与 report 最小动作回路
- 正式 `MobileWebRuntime` 的 upload 页已补上页面内 draft 编辑、三圈检测与继续进入 loading 的动作

但它仍然不是完整联调成品：

- report / history 仍保留部分前端占位语义
- 上传接口当前只落本地临时文件，并带最小过期清理；还没有正式对象存储 / CDN / 完整生命周期治理

## 迁移收口状态

如果当前目标是“先把旧主线迁完”，那 mobile-web 现在可以按下面理解：

- 已迁入并可重复联调：
  - 上传选图与上传对象换路径
  - 三圈检测
  - Lite `create + status + report`
  - `existing` 复用提示
  - 历史记录加载、筛选、回到 `report / loading`
  - Pro 入口兼容占位页
- 当前唯一明确阻塞：
  - 正式 `一梳 Pro 版` 生成与报告读取还没有恢复，只接了真实 `upgrade` 兼容占位接口

当前迁移期上传对象契约也先固定为：

1. 浏览器文件先走 `upload-image`
2. 前端把返回结果收口到 `MobileWebUploadDraft.uploadAsset`
3. 后续 `detect / create / report` 一律消费 `uploadAsset.runtimeImagePath`

在正式对象存储接入前，先按这套契约继续推进，不把存储升级本身作为 Lite 主链路迁移的阻塞项。
