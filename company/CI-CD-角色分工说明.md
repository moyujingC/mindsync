# CI/CD 角色分工说明

> 状态：current
> 版本：0.1.0
> owner：CEO / Orchestrator
> last_updated：2026-04-14
> source_of_truth：company/CI-CD-角色分工说明.md
> reviewers：Engineer, Test / QA

这份文档用于说明 `墨予镜` 当前在 CI/CD 链路中，`Engineer` 与 `Test / QA` 的职责边界、任务接力点和状态流转责任。

它是公司级协作规则，不是某一个项目的临时说明。
当前内容以 `aimandala` 已落地的 CI/CD、Paperclip 故障路由与自动修复链路为首个正式样例。

如果需要先理解“当前这套 CI/CD 系统本身由哪些组件构成、如何流转”，应先看：

- [company/knowledge-base/system/当前CI-CD系统机制总览.md](../company/knowledge-base/system/当前CI-CD系统机制总览.md)

## 1. 为什么这份文档存在

在 `墨予镜` 中，CI/CD 不只是“跑个 workflow 看红绿”。

它同时涉及：

- 实现与修复
- runner 与自动化宿主机治理
- 失败建单与 Paperclip 路由
- 回归验证
- review 与是否放行

如果没有单独写清 `Engineer` 和 `Test / QA` 在这条链路里各自负责什么，就很容易出现三类混淆：

1. `Engineer` 修完就默认算通过
2. `Test / QA` 被误解为“帮忙跑一下”
3. `in_review`、`done`、`blocked` 的责任边界不清

因此这份文档的目标是把下面三个问题固定下来：

1. 谁负责做
2. 谁负责验
3. 谁负责决定能不能过

## 2. Engineer 与 Test / QA 的职责边界

### 2.1 Engineer

`Engineer` 在 CI/CD 链路中的默认职责是：

- 实现 CI/CD 相关 workflow、脚本、runner 和自动化能力
- 承接 `build-failure`、`ci-test-failure`、`infra-runner-failure` 等失败问题
- 定位问题属于代码、基础设施、凭证还是工作区问题
- 完成修复、联调、复跑和必要的交付回写
- 在 Paperclip 中持续回写当前判断、已做动作、下一步动作和阻塞原因
- 向 `Test / QA` 提交可验证的修复结果与验证输入

`Engineer` 不应默认：

- 代替 `Test / QA` 完成最终验收
- 因为“本地复跑通过”就自行宣布可放行
- 在缺少验收结论时把问题单直接收口为 `done`

### 2.2 Test / QA

`Test / QA` 在 CI/CD 链路中的默认职责是：

- 设计验收标准和回归检查点
- 检查修复是否真的满足当前 spec、qa 和交付要求
- 做回归验证，而不是只看单次命令是否通过
- 对交付物做 review，并给出是否可放行的质量结论
- 当结果不达标、不可复现或验证材料不足时，明确退回

`Test / QA` 不应默认：

- 代替 `Engineer` 直接做修复实现
- 代替 `Engineer` 承担基础设施排障主责
- 因为工程师已经给出“已修复”评论，就跳过正式验收

### 2.3 一句话边界

- `Engineer`：负责修、联调、回写、提交验证输入
- `Test / QA`：负责验、回归、review、决定能不能过

## 3. CI/CD 生命周期责任表

| 环节 | Engineer | Test / QA |
| --- | --- | --- |
| CI/CD 方案落地 | 主负责，落地 workflow、脚本、runner、heartbeat、故障路由与自动修复边界 | 参与审查验收口径是否可测、是否具备回归入口 |
| 失败建单与故障分类 | 主负责，识别失败来源并回写 Paperclip | 不主负责 |
| 根因定位 | 主负责，判断是代码、基础设施、凭证还是工作区问题 | 可补充风险判断，但不承担主定位责任 |
| 修复实现 | 主负责，改代码、改脚本、改配置、联调 | 不直接做修复实现 |
| 运行中回写 | 主负责，回写当前判断、已做动作、下一步动作、阻塞原因与执行基线 | 不主负责 |
| 本地 / 在线复跑 | 主负责，确认修复在技术上是否生效 | 关注复跑结果是否满足验收前提 |
| 回归验证 | 提供修复说明、日志、分支、复跑结果和验证输入 | 主负责，检查关键路径、边界情况和回归风险 |
| review / 放行 | 提交实现结果和交付说明，等待验收 | 主负责，给出通过、退回或补验证要求 |
| `done` 收口 | 根据 QA 结论和交付物状态完成问题收束 | 给出是否可以 `done` 的质量依据 |

## 4. Paperclip 状态流转中的角色责任

| 状态 | 默认主导角色 | 说明 |
| --- | --- | --- |
| `todo` | CEO / 系统路由给 Engineer | 表示任务已进入待处理队列，通常尚未开始真正执行 |
| `in_progress` | Engineer | 表示修复、联调、隔离分支或执行中排障正在推进 |
| `blocked` | Engineer 先说明；Test / QA 可指出不可验收 | 当问题卡在基础设施、凭证、工作区漂移或外部人工动作时，不应继续假装推进中 |
| `in_review` | 若属于交付物验收，则由 Test / QA 主导判断 | 方向认可不等于交付物验收通过；需要区分父任务 review 和子任务验收 |
| `done` | Engineer 执行收口，但必须以 Test / QA 的验收结论为质量依据 | 不允许单靠工程师自证“修好了”直接关单 |

### 4.1 当前系统的实际口径

当前 `aimandala` 这套 CI/CD 主链路里：

- `Engineer` 是失败建单、修复、联调和运行时回写的主执行者
- `Test / QA` 主要在验证、回归、review 和放行环节介入
- `Test / QA` 目前不直接承接 nightly smoke、runner heartbeat 或自动修复执行主链
- `PR` 质量门默认服务于 merge / release 前质量判断，不等于 deploy smoke 已恢复或线上环境已可放行

如果未来要让 `Test / QA` 直接承接验收型巡检、nightly smoke 结果判定或更强的发布质量门，应在新的项目文档或公司级规则中另行扩展，而不是默认为当前已生效职责。
