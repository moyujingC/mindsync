# 怀瑾握瑜 MVP 实现计划

> 状态：current
> 版本：0.3.0
> owner：Engineer
> last_updated：2026-04-03
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/tasks/2026-04-02-mvp-implementation-plan.md
> 项目：aicareer
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/specs/2026-04-02-mvp-spec.md
> reviewers：CEO / Orchestrator, Architect, Test / QA

## 1. 输入

- MVP 产品 spec
- MVP 技术方案
- ADR-0001
- 文档治理规范

## 2. 范围

本轮先不写业务代码，先把执行面准备完整：

1. 明确数据结构草案
2. 明确对话流程草案
3. 明确未来项目目录和实现入口
4. 明确第一轮 QA 清单
5. 明确模拟样本准备方式

## 3. 任务拆解

1. 冻结 MVP 范围和主要场景
   - 输出：当前版 spec
2. 写出数据结构草案
   - 输出：architecture 中的数据结构部分
3. 写出对话流程草案
   - 输出：spec 中的用户流程 + architecture 中的主链路
4. 把 QA 清单补齐
   - 输出：qa 文档
5. 准备 2 到 3 个模拟样本
   - 输出：fixtures 设计说明或样本草案
6. 决定第一版代码落在哪个子目录
   - 输出：项目目录建议

## 4. 执行顺序

1. 先完成 spec review
2. 再完成 architecture review
3. 再确认 QA 清单
4. 最后再开代码实现任务

任何一步未完成，不跳到代码实现。

## 5. 交付物

本轮完成后，应该至少有：

1. 一份可评审的 spec
2. 一份可评审的技术方案
3. 一份可执行的 QA 清单
4. 一份明确的下一轮实现入口说明
5. 一份模拟样本清单
6. 一份正式实现任务定义

## 6. 风险

- 计划容易写得过虚，无法直接进入执行
- 还没有真实用户脚本，可能导致场景定义过于抽象
- 如果 review 不收口，文档会一直停留在“看起来完整，但无法开工”

## 7. 验证准备

进入实现前，至少要有：

- 一份被确认的 QA 清单
- 一份最小数据结构定义
- 一份最小流程定义
- 一份模拟样本清单
