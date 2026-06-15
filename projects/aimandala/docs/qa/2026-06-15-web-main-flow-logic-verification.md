# Web Main Flow Logic Verification

> 状态：verification / qa-gate
> 日期：2026-06-15
> 项目：一镜一梳 / Aimandala
> 对象：mobile-web 本地预览主链路逻辑
> 结论：有条件通过。本地预览下上传、Lite 报告、Pro 升级、Pro 报告、追问入口、历史筛选、历史详情和详情打开报告链路可继续；真实后端、真实支付和真实模型追问不在本轮范围内。

## 1. 本次验收对象

本轮从“UI 基本完成后，检查应用跑起来时是否存在逻辑错误和未跑通链路”的角度验收：

- `/upload` 测试图填充与开始解读
- `/report-entry` Lite 确认入口
- Lite 报告阅读与升级入口
- Pro 升级确认入口
- Pro 报告阅读与追问入口
- `/history` 历史列表、状态筛选、议题筛选、时间范围筛选
- `/history-record-detail` 历史详情、Lite / Pro 报告打开入口
- 前端自动化测试、类型检查和 lint

本轮只修阻塞主链路的逻辑问题，不调整视觉细节，不验证真实支付、真实后端生成质量和真实模型追问质量。

## 2. 验收标准

| 项目 | 标准 |
|---|---|
| 本地预览一致性 | 勾选“使用本地预览模式（不请求后端）”时，不应请求真实上传 / 报告刷新接口 |
| 上传入口 | 测试图一键填充后可直接进入报告确认页 |
| Lite 链路 | Lite 确认后进入可阅读报告，不出现 `Failed to fetch` 或“报告暂未生成” |
| Pro 升级 | Lite 报告升级按钮进入 Pro 确认页，确认后进入 Pro 报告 |
| Pro 追问入口 | Pro 报告显示追问入口，不出现网络失败错误 |
| 历史筛选 | 自定义日期范围能过滤“全部历史记录”清单 |
| 历史详情 | 历史详情能打开 Lite / Pro 报告，不请求真实刷新接口 |
| 自动化 | 前端 test / typecheck / lint 通过 |

## 3. 已执行验证

环境：

- URL：`http://localhost:4173`
- 命令：`npm run dev:mobile-web -- --host 0.0.0.0 --port 4173`
- Browser：Codex in-app Browser
- 模式：local debug + mobile-web preview

### 3.1 自动化检查

```bash
cd projects/aimandala/toC/app/frontend
npm test
npm run typecheck
npm run lint
```

结果：

| 命令 | 结果 |
|---|---|
| `npm test` | 14 files passed, 65 tests passed |
| `npm run typecheck` | pass |
| `npm run lint` | pass |

### 3.2 浏览器主链路

| 链路 | 结果 |
|---|---|
| `/upload` 页面身份、开发控制台、手机壳渲染 | pass |
| 测试图 01 一键填充 -> 开始解读 -> `/report-entry` | pass |
| Lite 确认解读 -> `/report` Lite 报告 | pass |
| Lite 报告 -> 升级到 Pro -> Pro 确认页 | pass |
| Pro 确认 -> `/report` Pro 报告 | pass |
| Pro 报告追问入口 | pass |
| `/history` 自定义日期 `2026-06-01` 到 `2026-06-11` | pass，清单只保留 06/08、06/05、06/02 |
| 历史详情页打开 | pass |
| 历史详情 -> 查看 Lite | pass |
| 历史详情 -> 查看 Pro | pass |

说明：Browser 截图能力在本轮偶发超时，本轮主要使用 URL、DOM 文本、按钮状态、路由状态和 console logs 作为证据。

## 4. 本轮发现与修复

### P0：测试图一键填充后无法进入报告确认页

现象：

- 点击“测试图 01 一键填充”后，再点“开始解读”，页面仍停留在 `/upload`。
- 开发控制台文案提示“当前已填入测试图、默认议题和人工三圈比例，可直接进入解读生成”，但 fixture 实际没有写入 `innerRadius` / `middleRadius`。

修复：

- `mobile-web/dev-fixtures.ts` 给两组测试图补默认三圈比例。
- 本地测试图现在可直接进入 `/report-entry`。

### P0：本地预览模式仍请求真实上传接口

现象：

- 勾选“使用本地预览模式（不请求后端）”时，Lite 确认后仍出现 `Failed to fetch`。
- 原因是 preview 模式下带有 `browserFile` 时，`ensureUploadedImagePath` 优先调用真实上传。

修复：

- `mobile-web/upload-runtime.ts` 在 `allowExistingImagePath` 为 true 时优先复用现有图片路径。
- 新增测试覆盖“预览模式带 browserFile 时仍不请求真实上传”。

### P0：Pro 升级确认后仍回到 Lite 报告

现象：

- Lite 报告点击“升级到 Pro 版本”后进入 Pro 确认页。
- 点击“升级 Pro版”后返回 `/report`，但路由状态仍是 `liteReady`，页面仍是 Lite 报告升级卡。

修复：

- `mobile-web/browser-shell.tsx` 在 preview 模式下按 `reportType` 选择 `reportPro` fixture。
- Pro 确认后现在进入 `proReady` 报告，显示深层主线、深度解读、三圈能量和追问入口。

### P0：历史详情打开 Lite / Pro 报告请求真实刷新接口

现象：

- 从历史详情点击“查看 Lite”出现 `Failed to fetch` 和“报告暂未生成”。
- 从历史详情点击“查看 Pro”进入 loading 错误态。
- 原因是 preview 模式下仍调用 `refreshMobileWebReport`。

修复：

- `mobile-web/browser-shell.tsx` 在 preview 模式下直接构造 Lite / Pro 本地报告状态。
- 历史详情打开 Lite / Pro 均不再请求真实刷新接口。

## 5. 回归点

- 本地预览和真实联调的分支边界：
  - preview mode 不请求真实上传 / 刷新。
  - runtime / non-preview 仍保留真实接口路径。
- 测试图 fixture：
  - 需要同时维护图片、议题和三圈比例。
- Pro 报告入口：
  - Lite 报告升级入口和历史详情 Pro 入口都要进入 `proReady`。

## 6. QA Gate 结论

结论：**有条件通过**。

允许继续：

- Web 本地预览主链路可以作为下一轮逻辑验收和人工体验走查入口。
- Lite / Pro 报告阅读、升级、追问入口和历史详情链路可继续。
- 历史筛选和时间范围筛选可继续做更细的边界测试。

保留风险：

- 本轮不验证真实后端报告生成、真实上传服务、真实支付和真实模型追问。
- 本地 debug host 的 `/history` 默认使用预设样例数据，不代表真实用户历史写入展示策略。
- Browser 截图接口偶发超时，未作为本轮主要证据。

退回条件：

- 若本地预览再次出现 `Failed to fetch`，优先检查 preview / runtime 分支是否混用。
- 若测试图一键填充后不能直接进入报告确认页，退回 fixture 的三圈比例和 `hasDraftResolvedCircleRadii` 检查。
- 若 Pro 升级后仍显示 Lite 报告，退回 `createPreviewAppProps` 路由选择和 `reportType` 传递。
