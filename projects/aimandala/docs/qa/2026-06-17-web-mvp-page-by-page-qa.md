# Web MVP 页面级上线前 QA

> 状态：verification / qa-gate
> 日期：2026-06-17
> 项目：一镜一梳 / Aimandala
> 对象：mobile-web MVP 页面级上线前测试与小范围优化
> 结论：有条件通过。本地预览页面主链路、Pro 支付异常态、历史页和历史详情状态可继续；真实上传、真实后端生成、真实支付、真实模型追问仍需上线前专项 smoke。

## 1. 本轮验收对象

按页面覆盖：

| 页面 | 路径 | 结论 |
|---|---|---|
| 落地页 | `/` | pass |
| 上传页 | `/upload` | pass，已修运行态未上传误放行 |
| Lite 支付 / 确认页 | `/report-entry` | pass |
| Lite 报告页 | `/report` / `/report/lite` | pass |
| Pro 升级确认页 | `/report-entry?reportType=pro` | pass，已补支付状态提示 |
| Pro 报告页 | `/report` / `/report/pro` | warn，报告和追问入口可用，但段落级追问面板较多，需产品侧确认体验密度 |
| 历史页 | `/history` | pass |
| 历史详情：未升级 | `/history-record-detail/not-upgraded` | pass |
| 历史详情：Pro 生成中 | `/history-record-detail/generating` | pass |
| 历史详情：Pro 已可查看 | `/history-record-detail/viewable` | pass |

## 2. 执行环境

| 项目 | 记录 |
|---|---|
| 前端路径 | `projects/aimandala/toC/app/frontend` |
| 本地 URL | `http://localhost:4173` |
| 启动命令 | `npm run dev:mobile-web -- --host 0.0.0.0 --port 4173` |
| Browser | Codex in-app Browser |
| 支付环境 | preview QA scenario |
| 是否真实后端 | 否 |
| 是否真实支付 | 否 |
| 是否真实模型 | 否 |

## 3. 页面级检查结果

### 3.1 落地页

- 页面可渲染，根节点非空，控制台无 error / warn。
- 主按钮“开始体验”可进入上传页。
- Lite / Pro 价格关系可见：Lite 9.9 元，Pro 再付 29 元升级。
- 页面包含“不是医学或心理诊断”等安全边界表达。

### 3.2 上传页

- 预览模式：默认测试草稿可进入 Lite 确认页，方便 QA 主链路测试。
- 运行态：未选择画作时，“开始解读”已禁用，不再进入报告确认页。
- 三圈滑杆、议题选择、隐私提示可见。
- 修复项：浏览器宿主在 `preview=0` 时不再使用 `/tmp/example-mandala.png` 作为默认画作。

### 3.3 Lite 确认页与 Lite 报告页

- Lite 确认页可展示议题、价格、兑换码入口和“确认解读”按钮。
- 点击确认后进入 Lite 报告页。
- Lite 报告正文非空，可见 Lite 标识、生成时间、初步解读、核心看见和小实验。
- Lite 报告底部可见 Pro 升级入口，表达为基于当前报告继续深入，不要求重新上传。

### 3.4 Pro 升级确认页

- Pro 升级页明确展示“再付 29 元升级”。
- 文案已改为“支付确认前不会展示 / 解锁 Pro 权益内容”，避免旧的“直接跳过支付确认”误导。
- 支付 QA 场景覆盖：
  - 成功：进入 Pro 报告页。
  - 回调延迟：显示“等待支付确认”，按钮变为“等待确认中”并禁用，提示不要重复支付。
  - 取消：提示 Pro 权益未解锁，可重新发起。
  - 失败：提示支付或权益刷新失败，Pro 权益未解锁。
- 修复项：用户可见的“失衡诊断”统一改为“失衡线索”。

### 3.5 Pro 报告页

- Pro 报告页可渲染，显示 Pro 标识、深层主线、深度解读、三圈能量、模式形成原因、调节建议。
- 追问入口可见，空输入时发送按钮禁用。
- 当前风险：段落级追问面板在多个模块内出现，页面密度偏高。本轮不作为阻塞修复，建议 UI / Product 在上线前确认是否保留段落级追问，或收束为单一全局追问入口。

### 3.6 历史页与历史详情

- 历史页可展示待查看记录、全部历史记录、状态筛选、议题筛选和时间范围筛选。
- 历史详情三种状态均可渲染：
  - 未升级 Pro：展示 Lite 可查看和升级 Pro。
  - Pro 生成中：展示生成进度与查看进度。
  - Pro 已可查看：展示 Lite / Pro 均可查看。
- 控制台无 error / warn。

## 4. 本轮修复

### P0：运行态上传页未选图也能进入 Lite 确认页

现象：

- 打开 `http://localhost:4173/upload?clean=1&preview=0&controls=0`。
- 页面视觉上显示“点击上传或拍照”，但“开始解读”可点。
- 点击后进入 Lite 确认页，等于真实用户可以跳过上传。

修复：

- `mobile-web/runtime.tsx` 的运行态默认草稿改为空图片。
- `mobile-web/browser-shell.tsx` 拆分预览默认草稿和运行态空草稿。
- 运行态 `onUploadContinue` 增加空图片保护。
- 新增测试覆盖未选择画作时不能进入确认页。

### P1：支付与安全文案

修复：

- Pro 升级不再表达“跳过支付确认”。
- Pro 支付 pending / cancelled / error 均有用户可理解提示。
- 用户可见文案中的“失衡诊断”改为“失衡线索”。

## 5. 自动化验证

在 `projects/aimandala/toC/app/frontend` 执行：

| 命令 | 结果 |
|---|---|
| `npm test` | pass，14 files / 69 tests |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run build:mobile-web` | pass |

构建提示：

- `history-dunhuang-pattern-clean.png referenced ... didn't resolve at build time` 仍出现，但构建成功，且最终产物包含该图片 asset。当前记录为非阻塞构建警告。

## 6. QA Gate 结论

结论：**有条件通过**。

允许继续：

- 继续进入真实后端 / 真实支付 / 真实模型 smoke。
- 本地页面级主链路可作为上线前人工回归入口。

保留风险：

- 本轮没有验证真实上传服务、真实报告生成、真实支付回调、真实权益同步和真实 followup 接口。
- Pro 报告段落级追问面板密度偏高，建议上线前做一次产品体验确认。
- 历史页本地样例数据不代表真实用户历史写入策略。

退回条件：

- 运行态未上传仍能进入报告确认页。
- 支付失败 / 取消后仍解锁 Pro。
- Pro 同步中仍允许重复点击支付。
- 真实后端 smoke 中出现报告空白、付费后无处查看、权限串用户或安全越界输出。
