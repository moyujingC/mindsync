# Report Pages Main Path Delivery

> 状态：delivery
> 日期：2026-06-14
> 项目：一镜一梳 / Aimandala
> 阶段：report pages main path verification
> depends_on：projects/aimandala/docs/qa/2026-06-14-report-pages-main-path-verification.md

## 1. 本轮交付内容

本轮完成 Aimandala mobile-web 报告页主链路验收和阻塞入口修复：

1. 验收最近 Lite / Pro report 与 Pro followup 相关提交。
2. 本地跑通 `/report`、`/report/lite`、`/report/pro` 主阅读路径。
3. 修复显式 `/report/lite` 下升级入口不进入 Pro 升级页的问题。
4. 修复本地 Pro 追问暴露 `Failed to fetch` 的问题。
5. 补充自动化测试和本 QA / delivery 记录。

## 2. 代码改动

| 文件 | 改动 |
|---|---|
| `toC/app/frontend/mobile-web/browser-shell.tsx` | 报告页主按钮逻辑覆盖 `reportLite` / `reportPro` |
| `toC/app/frontend/mobile-web/page-shells/pro-report-page.tsx` | followup 网络失败显示中文兜底 |
| `toC/app/frontend/shared/api/config.ts` | local dev 默认关闭真实 followup API，允许显式开启 |
| `toC/app/frontend/shared/api/config.test.ts` | 增加 followup 开关测试 |
| `toC/app/frontend/mobile-web/app.test.tsx` | 补充 `/report/lite` 升级入口渲染断言，并对齐当前 loading / history 文案 |
| `toC/app/frontend/mobile-web/runtime.test.tsx` | 对齐当前历史详情按钮 DOM 与文案 |

## 3. 验证结果

通过：

```bash
cd projects/aimandala/toC/app/frontend
npm test -- mobile-web/app.test.tsx mobile-web/runtime.test.tsx shared/api/config.test.ts shared/api/services.test.ts mobile-web/page-shells/report-page.test.tsx
```

结果：

```text
Test Files  5 passed (5)
Tests       29 passed (29)
```

浏览器验证：

- `http://localhost:4173/report`
- `http://localhost:4173/report/lite`
- `http://localhost:4173/report/pro`

结论：

- 三个路径均可渲染报告内容。
- Pro 追问本地预览返回模拟补充解读，不再暴露 `Failed to fetch`。
- 控制台未发现相关 error / warn。

## 4. 未完成项

本轮明确未做：

1. 未验证真实支付和权益同步。
2. 未验证真实后端 followup 接口。
3. 未修全量 typecheck 中既有 history / miniapp 类型问题。
4. 未修全量 lint 中既有 unused 代码问题。
5. 未改报告内容、报告模板结构或 Pro 对外上线口径。

## 5. Handoff

下一轮建议拆成两个独立任务：

1. Report payment / entitlement QA：
   - Pro 升级支付发起
   - 支付成功 / 取消 / 回调延迟
   - 权益刷新和历史恢复
2. Frontend baseline cleanup：
   - `HistoryFilterId` / `InterpretationListFilter` 类型收口
   - `pro_ready_at` 类型补齐或字段移除
   - unused 代码清理

本轮修复已收束到报告阅读和入口阻塞问题，不建议继续在同一提交里混入 history / miniapp 基线清理。
