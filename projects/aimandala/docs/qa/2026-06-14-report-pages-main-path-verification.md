# Report Pages Main Path Verification

> 状态：verification / qa-gate
> 日期：2026-06-14
> 项目：一镜一梳 / Aimandala
> 对象：mobile-web Lite / Pro report pages and Pro followup entry
> 结论：有条件通过。报告阅读、Lite 升级入口和 Pro 追问入口主链路可继续；全量 typecheck / lint 仍受既有 history / miniapp 类型与 unused 代码问题影响。

## 1. 本次验收对象

本次验收针对最近 report / followup 相关提交后的 mobile-web 主链路：

- `/report`
- `/report/lite`
- `/report/pro`
- Lite 报告错误态
- Lite -> Pro 升级入口
- Pro 报告追问入口

最近相关提交：

| commit | 内容 |
|---|---|
| `3e4366a6` | align lite report preview |
| `c6103a2f` | align pro report preview |
| `53069198` | align pro followup middle states |

本轮只修阻塞阅读或入口的问题，不重做报告内容、不调整支付链路、不改变 Pro 对外上线口径。

## 2. 验收标准

| 项目 | 标准 |
|---|---|
| 报告页加载 | `/report`、`/report/lite`、`/report/pro` 首屏不是空白页，无 Vite / React 错误覆盖层 |
| Lite 阅读 | Lite 报告能看到标题、正文分段、保存 / 重新上传、升级入口 |
| Pro 阅读 | Pro 报告能看到标题、深层主线、深度解读、三圈能量、追问入口 |
| 错误态 | Lite 错误态显示可理解错误，不展示正文占位或调试路径 |
| 升级入口 | 显式 `/report/lite` 下点击升级入口能进入 Pro 升级确认页 |
| 追问入口 | 本地预览不应请求真实 followup 后端，不暴露 `Failed to fetch` |

## 3. 已执行验证

### 3.1 页面主链路浏览器检查

环境：

- URL：`http://localhost:4173`
- 命令：`npm run dev:mobile-web`
- 视口：390 x 844 mobile
- Browser：Codex in-app Browser

结果：

| 路径 | 页面身份 | 非空 | 错误覆盖层 | 控制台错误 | 结论 |
|---|---|---|---|---|---|
| `/report` | 当前路由 `report`，Lite 报告正文可见 | pass | pass | pass | pass |
| `/report/lite` | 当前路由 `reportLite`，Lite 报告正文可见 | pass | pass | pass | pass |
| `/report/pro` | 当前路由 `reportPro`，Pro 报告正文与追问入口可见 | pass | pass | pass | pass |

说明：Browser 截图接口在本轮多次超时，未作为证据落库；本轮采用 DOM 文本、按钮状态、URL 和 console logs 作为可复现证据。

### 3.2 自动化测试

```bash
cd projects/aimandala/toC/app/frontend
npm test -- mobile-web/app.test.tsx mobile-web/runtime.test.tsx shared/api/config.test.ts shared/api/services.test.ts mobile-web/page-shells/report-page.test.tsx
```

结果：

```text
Test Files  5 passed (5)
Tests       29 passed (29)
```

覆盖点：

- Lite / Pro 报告页静态渲染
- Lite 错误态
- `/report/lite` 升级入口渲染
- mobile-web runtime Lite -> Pro 升级路径
- 本地 followup 开关默认关闭，可显式开启
- API service contract 不变

### 3.3 全量检查

```bash
cd projects/aimandala/toC/app/frontend
npm run typecheck
```

结果：未通过。

失败集中在既有 history / miniapp 类型不一致：

- `HistoryFilterId` 包含 `review`，但 `InterpretationListFilter` / `SharedHistoryFilterId` 不接受该值。
- `SharedHistoryRecordItem` 缺少 `theme`。
- `InterpretationRecordResponse` 类型缺少 `pro_ready_at`。

本轮未修这些问题，因为它们不属于 report 阅读 / Lite 升级 / Pro followup 阻塞点。

```bash
cd projects/aimandala/toC/app/frontend
npm run lint
```

结果：未通过。

失败为既有 unused 代码：

- `mobile-web/components/history-cards.tsx` 的 `ICON_EYE`
- `mobile-web/page-shells/loading-page.tsx` 的 `LoadingVersionIcon`
- `mobile-web/page-shells/pro-report-page.tsx` 的 `ProReportMarkdown`
- `mobile-web/pages/history-record-detail-page.ts` 的 `presentation`
- `shared/ui/report-entry.tsx` 的 `redeemHint`

本轮未修这些问题，因为它们不阻塞报告页阅读和入口路径。

## 4. 本轮发现与修复

### P0：`/report/lite` 升级入口点击后未进入 Pro 升级页

现象：

- 在显式 `/report/lite` 路由下，Lite 报告升级按钮可见，但点击后仍停留在 Lite 报告。
- 原因是 preview 主按钮处理只识别旧的 `route === "report"`，未覆盖 `reportLite`。

修复：

- `mobile-web/browser-shell.tsx` 中主按钮和次按钮逻辑同时覆盖 `report` / `reportLite` / `reportPro`。
- Pro 报告下仍保留重新上传逻辑，不误触发升级。
- 补充 `/report/lite` 渲染和 runtime Lite -> Pro 入口测试。

### P0：本地 Pro 追问暴露 `Failed to fetch`

现象：

- 本地预览 `/report/pro` 输入追问后会请求真实 `/api/report-followups`。
- 后端未启动时，页面直接显示 `Failed to fetch`，影响报告阅读和追问入口验收。

修复：

- 本地 dev 且未显式开启 followup API 时，默认使用本地模拟回答。
- 真实接口仍可通过 `AIMANDALA_REPORT_FOLLOWUP_ENABLED=1` 或 `VITE_AIMANDALA_REPORT_FOLLOWUP_ENABLED=1` 显式开启。
- 网络失败兜底文案改为中文：`追问暂时没有连上服务，请稍后再试。`

## 5. QA Gate 结论

结论：**有条件通过**。

允许继续：

- Lite 报告阅读路径可继续。
- Pro 报告阅读路径可继续。
- Lite -> Pro 升级入口可继续进入下一轮支付 / 权益验证。
- 本地 Pro followup 入口可用于交互验收；真实 followup 质量仍以 backend smoke / 真实模型 smoke 为准。

保留风险：

- 全量 typecheck 和 lint 仍未通过，需单独开 history / miniapp 类型与 unused 代码清理任务。
- 本轮 Browser 截图接口不稳定，未保留截图证据。
- 本轮不验证真实支付、真实模型 followup、真实后端 `/api/report-followups` 可用性。

退回条件：

- 后续若 `/report/lite` 升级入口再次停留原页，应退回 Engineer 修复 route handling。
- 后续若本地预览再次暴露英文网络错误，应退回 Engineer 修复 followup fallback。
