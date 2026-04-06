# 一镜一梳 To C mobile-web 交互基线记录

> 状态：draft
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-04-mobile-web-interaction-baseline.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-04-frontend-baseline-delivery.md

## 1. 本轮目标

这一轮最开始不是接真实业务接口，而是把 `mobile-web` 从“能展示骨架”继续推进到“能表达真实页面节奏”的交互基线。

重点是：

- 上传页更像手机端上传入口
- loading / report / history 的页面状态更清楚
- 本地预览模式与真实联调运行时的边界更清楚
- 在预览壳内逐步接入真实 To C 最小主路径

## 2. 当前交付结果

### 2.1 上传页

当前上传页已经具备：

- 上传入口卡
- 浏览器原生选图
- 本地缩略图预览
- 示例路径回填
- 主题 / 创作意图 / 创作感受输入
- 上传对象标识摘要
- 三圈检测卡
- 检测中的加载态与错误态
- 预览模式下触发真实 `detect-circles`
- 浏览器本地文件先上传换成后端临时 `image_path`

当前页面节奏已经收口为：

1. 先选择画作
2. 再拿到三圈建议
3. 然后才能进入当前解读流程

当前仍不代表真实文件上传接口已经完成，但上传页的检测动作已经开始能触发真实接口。

### 2.2 loading / report

当前 loading / report 页面已经具备：

- 结果页指标卡
- loading 进度条
- loading 阶段列表
- Lite 结构化内容卡
- Lite richer 结构字段渲染
- Pro richer 结构字段渲染
- structured 卡片优先的 report 阅读顺序
- 更明确的下一步动作
- 预览壳里对真实 Lite 主路径的最小尝试
- loading 阶段受控自动轮询真实 `status`
- 运行中的禁用态与失败回路

当前页面行为：

- `loading`
  - 进入后会自动尝试轮询真实 `status`
  - 也保留手动继续查看生成进度
  - 也可以返回上传页
- `report`
  - 可以进入历史页
  - 也可以重新上传画作

当前补充说明：

- 对可用图片路径，预览壳已经会尝试真实跑 `create + status + report`
- 对浏览器本地文件，现在会先走最小上传接口换到后端本地临时路径
- upload / loading / report 现在都会复用同一份 `uploadAsset` 对象状态
- 上传页摘要区以及 loading / report 的对象状态卡现在都能直接看到 `runtime image path / storage_backend / storage_key / image_url`
- 后端本地上传现在也已能返回稳定 `image_url`，用于把本地临时上传与后续对象存储先收口到同一消费契约
- 后端上传层现在已支持 `cos` 真实上传，同时仍保留本地 `image_path`，因此 mobile-web 侧 `uploadAsset` 契约不需要再改
- 当 `status.report_ready` 仍未完成时，预览壳会继续按受控节奏轮询
- 手动刷新、失败提示和返回上传页的回路仍然保留
- 正式 `MobileWebRuntime` 现在也已补上 loading 自动轮询与 report -> history 的最小动作推进
- 正式 `MobileWebRuntime` 的 upload 页现在也已补上页面内 draft 编辑、检测与继续进入 loading 的动作
- Lite 报告现在已经开始承接更完整的 story / theme_insights / three_awareness / six_insights / experiment 结构
- Lite 报告文案组织现在已开始向旧主线正式报告靠拢，不再只是迁移说明口吻；章节已收口到“你的心灵画像故事 / 在主题中的具体表现 / 三个日常小觉察 / 关于一梳”
- Pro 报告现在已经开始承接 first_impression / core_insight_table / three_circles_detailed / root_cause / healing_suggestions 结构
- Pro 报告文案组织现在也已开始向旧主线正式深度报告靠拢，不再只是升级说明和字段占位堆叠；章节已收口到“第一眼直觉 / 核心洞察表格 / 三圈深度诊断 / 失衡识别 / 根源探索 / 疗愈建议”
- Lite / Pro 报告文案现在已经开始受 `theme / painting_intention / painting_feeling / 三圈参数` 影响，不再只是固定模板
- Lite / Pro 报告 markdown 已开始统一包上 safety disclaimer
- Pro 报告里内嵌 Lite 基础时，已去掉重复 disclaimer，阅读顺序更接近正式产品
- 当前 structured 卡片可用时，report 页已不再重复堆叠原始正文，整体阅读顺序更接近正式产品报告
- 后端本地临时上传目录已补上最小过期清理，避免文件无限堆积

### 2.3 history

当前历史页已经具备：

- 历史摘要卡
- 历史记录列表
- `全部 / 可查看 / 生成中` 筛选
- 按筛选状态变化的空态文案
- 真实历史记录优先加载
- runtime 下按筛选条件重新请求真实历史列表
- history 查询已开始统一收口到 `historyQuery(filter / limit / theme)`
- history 页面层已开始露出主题筛选入口
- history 页面层已开始露出显示数量切换
- history 列表项已开始支持打开报告 / 查看进度
- history 列表项在打开记录时会进入受控禁用态，并提示正在刷新真实状态
- history 列表项会把原始运行态映射成用户态的阶段文案、进度说明和可读创建时间
- history 列表项已开始区分当前记录是 `Lite` 还是 `Lite + Pro`，并给出更准确的打开动作
- history 打开已有 `Lite + Pro` 记录时，已开始直接进入 Pro 报告，而不再重复走 Lite 刷新
- 真实拉取失败时回退到 fixture，并在页面内说明

这意味着历史页已经开始具备最小的信息组织能力，而不只是简单列表。

### 2.4 环境边界说明

当前手机页面本身已经能明确说明：

- 当前是否是本地预览模式
- 当前是否是联调运行时
- 当前页面中的检测、进度、报告是否来自占位数据
- history 当前展示的是“真实记录”还是“占位记录”

这一步解决的是协作时最容易混淆的问题：

- 现在看到的是“前端预览结果”
- 还是“真实 loader + 接口装配结果”

## 3. 当前仍未完成

当前仍未完成的部分包括：

- `一梳 Pro 版` 当前已恢复最小正式生成与读取闭环，但内容仍为迁移期占位报告，后续仍需替换成正式 Pro 生成链路
- 上传文件从本地临时落盘升级到正式对象存储 / 持久化方案
- `uploadAsset` 与后端正式对象存储标识之间的长期契约仍需继续收敛
- report 页更细的错误恢复与刷新策略
- history 页查询语义虽然已有 `historyQuery` 落点，但更细粒度的后端查询能力仍需继续收敛
- 上传、loading、report、history 之间的正式路由方案

## 3.1 迁移对齐表

当前先以“旧功能迁移完成”为目标，对齐情况如下：

| 能力 | 当前状态 | 说明 |
| --- | --- | --- |
| 上传图片 | 已迁入 | 支持浏览器原生选图、本地缩略预览、样例路径回填 |
| 上传对象换运行时路径 | 已迁入 | 浏览器文件先走 `POST /api/v2/upload-image`，前端统一收口到 `uploadAsset` |
| 本地上传可访问 URL | 已迁入 | `local` 上传也会返回可访问的 `image_url`，并可通过 `/api/v2/uploads/{storage_key}` 读取 |
| COS 真实上传 | 已迁入 | 后端已支持 `AIMANDALA_UPLOAD_BACKEND=cos`，同时保留本地 `image_path` 供当前 Lite / Pro 主链继续消费 |
| 三圈检测 | 已迁入 | upload 页与 runtime 都能真实触发 `detect-circles` |
| Lite 创建 | 已迁入 | 预览壳与 runtime 都能跑真实 `POST /api/v2/interpretations` |
| Lite 进度刷新 | 已迁入 | loading 页支持自动轮询 `status`，也保留手动刷新 |
| Lite 报告读取 | 已迁入 | report 页真实读取 `report`，并开始直接展示 richer structured Lite 内容；文案也已开始跟输入变化 |
| 既有记录复用提示 | 已迁入 | 命中 `existing=true` 时，report 页会明确提示当前复用了已有记录 |
| 历史记录读取 | 已迁入 | history 页真实优先加载，失败时回退 fixture |
| 历史记录筛选 | 已迁入 | `filter / theme / limit` 已统一走 `historyQuery` |
| 历史记录回到报告/进度 | 已迁入 | 列表项可打开 `loading / Lite / Pro`，并带单条记录忙态 |
| Pro 入口提示 | 已迁入 | report 页可进入真实 `upgrade` 并继续读取 Pro 报告 |
| 正式 Pro 生成 | 已迁入最小闭环 | 当前 upgrade 已能真实写入并读取迁移期 Pro 报告，页面已开始直接展示 richer structured Pro 内容，文案也已开始跟输入变化 |

## 3.2 当前上传对象契约

在迁移完成正式对象存储前，当前先固定下面这套“可迁移、可联调”的上传契约：

1. 浏览器本地文件先调用 `POST /api/v2/upload-image`
2. 后端返回一份当前 `V2` 主链路可直接消费的 `image_path`
3. 前端只通过 `MobileWebUploadDraft.uploadAsset` 保存运行时对象语义：
   - `runtimeImagePath`
   - `storageBackend`
   - `storageKey`
   - `imageUrl`
4. 后续 `detect-circles / create / status / report` 统一继续消费这份运行时对象，而不是回头依赖浏览器临时路径
5. 这套契约当前已经足够支撑迁移期 mobile-web 主链路，不把“正式对象存储”作为 Lite 主链路迁移放行前置
6. 当前即使切到 `cos`，前端也仍只消费同一份 `uploadAsset`，不会因为对象存储切换而增加页面层分支

## 4. 当前价值

这一轮最重要的价值不是“页面变漂亮了”，而是：

1. `mobile-web` 已经开始具备真实产品节奏，而不是静态骨架
2. 页面内动作开始成链
3. 预览模式与联调运行时的边界已经可见
4. 上传页和 Lite 最小主路径已经开始接入真实接口
5. 后续接真实接口时，有明确的 UI 落点和状态语义

## 5. 下一步建议

后续优先建议：

1. 把当前本地临时上传升级成正式对象存储或持久化图片方案
2. 在现有最小过期清理之上，补齐上传后图片生命周期、清理策略和路径治理
3. 把 report 页的错误恢复、刷新与重试继续补齐
4. 把 history 页的筛选逐步切到真实接口参数
