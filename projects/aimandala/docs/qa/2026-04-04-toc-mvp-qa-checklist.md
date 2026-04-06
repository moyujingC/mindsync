# 一镜一梳 To C MVP 验收与测试清单

> 状态：draft
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-04-toc-mvp-qa-checklist.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-04-toc-mvp-spec.md
> reviewers：CEO / Orchestrator, Product Spec Lead, Engineer

## 1. 目标行为

1. 用户能够通过手机端 Web 完成 To C 主路径。
2. 系统能够完成三圈检测与 `一镜 Lite 版` 生成。
3. 用户能够从当前流程进入 `一梳 Pro 版`，并得到对应较重解读结果。
4. 用户能够读取当前报告与历史记录。
5. 当前实现不会混入 To B / Studio / `V3` 实验线。

## 2. 验收标准

1. To C 主路径有明确步骤和输入输出定义。
2. 当前正式 API 主线明确是 `V2`，而不是 `V3`。
3. `一镜 Lite 版` 与 `一梳 Pro 版` 的当前关系清楚，并与产品口径一致。
4. 当前用户端主入口明确是手机端 Web。
5. 前端结构明确区分“共享内核”和“渠道实现”，而不是把业务逻辑散落在渠道 UI 中。
6. 当前文档中明确写出哪些能力暂不纳入首批。
7. 当前挂牌价与优惠机制口径一致。

## 3. 关键路径

1. 用户进入手机端 Web
2. 上传图片并补充必要描述
3. 完成三圈检测与确认
4. 生成 `一镜 Lite 版`
5. 查看 `一镜 Lite 版` 报告
6. 进入并生成 `一梳 Pro 版`
7. 查看历史记录或再次读取报告

## 4. 边界情况

1. 图片上传失败或格式不符合要求
2. 三圈检测失败或结果不可信
3. 已存在相同解读记录，需要提示用户复用还是强制重新生成
4. `一镜 Lite 版` 已完成但进入 `一梳 Pro 版` 失败
5. 当前渠道不是手机端 Web，而未来小程序或 App 尚未进入本轮实现
6. 前端把共享业务逻辑写回渠道层组件，导致未来不可复用
7. 产品把“当前流程”误当成“未来最终流程”

## 5. 验证方法

当前阶段采用人工验证为主，后续逐步补自动化：

1. 纸面走查一条完整 To C 用户路径
2. 用样本数据验证 `一镜 Lite 版` -> `一梳 Pro 版` 当前流程
3. 对照 spec、architecture 和 QA 清单检查边界是否一致
4. 检查当前设计是否误把 To B / `V3` 带入正式主线

建议样本至少覆盖：

1. 正常上传并成功生成 Lite
2. `一镜 Lite 版` 成功后进入 `一梳 Pro 版`
3. 命中已有记录并触发复用提示

未来自动化测试切入点：

- `V2` API 端点存在性与响应结构校验
- 五层数据模型结构检查
- `一镜 Lite 版` -> `一梳 Pro 版` 当前流程检查
- 前端共享层与渠道层引用边界检查

## 6. 测试用例清单

1. `TC-01 上传图片并创建一镜 Lite 版解读`
   - 期望：调用 `POST /api/v2/interpretations` 成功，返回 `一镜 Lite 版` 基础结果
2. `TC-02 获取一镜 Lite 版报告`
   - 期望：可以通过报告接口读取当前 `一镜 Lite 版` 报告，且报告内容会受主题、用户输入和三圈参数影响
3. `TC-03 进入一梳 Pro 版`
   - 期望：当前流程可以从 `一镜 Lite 版` 引导进入 `一梳 Pro 版`，并读取 `version=pro` 报告；报告内容会受主题、用户输入和三圈参数影响，且正文组织应接近“Lite 基础 + 深度分析 + 调节建议”
4. `TC-04 获取用户历史记录`
   - 期望：可以通过用户解读列表查看历史结果，并区分当前记录是 `Lite` 还是 `Lite + Pro`；打开已有 Pro 记录时应直接进入 Pro 报告
5. `TC-05 命中已有记录`
   - 期望：系统返回 `existing` 状态，而不是无提示重复生成
6. `TC-06 三圈检测失败`
   - 期望：系统能返回可识别的失败状态，不直接进入报告生成
7. `TC-07 当前实现未误接入 V3`
   - 期望：To C 主路径不依赖 `routes_v3`、`knowledge_v3` 或 V3 测试
8. `TC-08 当前实现未误接入 To B`
   - 期望：To C 主路径不依赖 `studio` 或疗愈师专用入口
9. `TC-09 前端共享内核边界成立`
   - 期望：共享流程、类型、API service 不被写死在渠道 UI 组件中
10. `TC-10 当前用户端主入口为 mobile-web`
   - 期望：当前正式入口只要求 mobile-web 可运行，小程序和 App 先不作为放行条件
11. `TC-11 当前价格口径固定`
   - 期望：当前正式口径为 `9.9 / 49`，优惠通过优惠券或兑换码处理

## 7. 放行条件

进入首批代码迁移前，至少要求：

1. `TC-01` 到 `TC-05` 都有明确人工验证方法
2. spec、architecture 与 QA 中的主路径定义一致
3. 团队确认当前正式主线是 To C + `V2` + mobile-web
4. 团队确认当前产品口径是 `一镜 Lite 版 / 一梳 Pro 版`

进入首批代码迁移后、正式继续开发前，至少要求：

1. 至少一条 `V2` 主路径可以被重复验证
2. 至少一组样本可以覆盖 `一镜 Lite 版` 与 `一梳 Pro 版` 当前流程
3. 已明确前端共享层与渠道层的落点

## 8. 结果记录

当前状态：

- To C MVP 的 spec、architecture、QA 清单已建立
- `一镜 Lite 版 -> 一梳 Pro 版` 当前最小正式链路已可重复验证
- 最近一轮命令级验证已通过：
  - `pytest projects/aimandala/toC/app/backend/tests/unit/test_api_health.py projects/aimandala/toC/app/backend/tests/unit/test_pipeline_orchestrator.py`
  - `npm run typecheck`
  - `npm run build:mobile-web`
- history 页当前已能直接打开已有 `Lite + Pro` 记录并落到 Pro 报告页，不再重复走 Lite 刷新
- Lite / Pro 报告当前都已开始向旧主线正式报告的文案组织靠拢，但仍未接入旧主线完整 AI 生成链路
- 当前仍缺：
  - 第一轮纸面验证记录
  - 第一批迁入后的样本验证结果
  - 更贴近旧主线正式内容的 Lite / Pro 生成验证结果
