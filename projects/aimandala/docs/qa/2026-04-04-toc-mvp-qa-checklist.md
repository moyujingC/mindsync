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
2. 系统能够完成三圈检测与 Lite 生成。
3. Lite 用户能够升级到 Pro，并复用已有前置数据。
4. 用户能够读取当前报告与历史记录。
5. 当前实现不会混入 To B / Studio / `V3` 实验线。

## 2. 验收标准

1. To C 主路径有明确步骤和输入输出定义。
2. 当前正式 API 主线明确是 `V2`，而不是 `V3`。
3. Lite 与 Pro 的升级关系清楚，且 Pro 基于 Lite 前置数据复用。
4. 当前用户端主入口明确是手机端 Web。
5. 前端结构明确区分“共享内核”和“渠道实现”，而不是把业务逻辑散落在渠道 UI 中。
6. 当前文档中明确写出哪些能力暂不纳入首批。

## 3. 关键路径

1. 用户进入手机端 Web
2. 上传图片并补充必要描述
3. 完成三圈检测与确认
4. 生成 Lite
5. 查看 Lite 报告
6. 发起升级并生成 Pro
7. 查看历史记录或再次读取报告

## 4. 边界情况

1. 图片上传失败或格式不符合要求
2. 三圈检测失败或结果不可信
3. 已存在相同解读记录，需要提示用户复用还是强制重新生成
4. Lite 已完成但升级失败
5. 当前渠道不是手机端 Web，而未来小程序或 App 尚未进入本轮实现
6. 前端把共享业务逻辑写回渠道层组件，导致未来不可复用

## 5. 验证方法

当前阶段采用人工验证为主，后续逐步补自动化：

1. 纸面走查一条完整 To C 用户路径
2. 用样本数据验证 Lite -> Pro 主流程
3. 对照 spec、architecture 和 QA 清单检查边界是否一致
4. 检查当前设计是否误把 To B / `V3` 带入正式主线

建议样本至少覆盖：

1. 正常上传并成功生成 Lite
2. Lite 成功后升级为 Pro
3. 命中已有记录并触发复用提示

未来自动化测试切入点：

- `V2` API 端点存在性与响应结构校验
- 五层数据模型结构检查
- Lite -> Pro 升级复用链路检查
- 前端共享层与渠道层引用边界检查

## 6. 测试用例清单

1. `TC-01 上传图片并创建 Lite 解读`
   - 期望：调用 `POST /api/v2/interpretations` 成功，返回 Lite 基础结果
2. `TC-02 获取 Lite 报告`
   - 期望：可以通过报告接口读取当前 Lite 报告
3. `TC-03 Lite 升级到 Pro`
   - 期望：调用升级接口后返回 Pro 报告，并保留 Lite 前置数据
4. `TC-04 获取用户历史记录`
   - 期望：可以通过用户解读列表查看历史结果
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

## 7. 放行条件

进入首批代码迁移前，至少要求：

1. `TC-01` 到 `TC-05` 都有明确人工验证方法
2. spec、architecture 与 QA 中的主路径定义一致
3. 团队确认当前正式主线是 To C + `V2` + mobile-web

进入首批代码迁移后、正式继续开发前，至少要求：

1. 至少一条 `V2` 主路径可以被重复验证
2. 至少一组样本可以覆盖 Lite -> Pro 闭环
3. 已明确前端共享层与渠道层的落点

## 8. 结果记录

当前状态：

- To C MVP 的 spec、architecture、QA 清单已建立
- 当前仍缺：
  - 第一轮纸面验证记录
  - 第一批迁入后的样本验证结果
  - 对应的 delivery 记录
