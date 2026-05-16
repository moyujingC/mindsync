# 财富议题报告真实样例回归

> 状态：in_progress
> 版本：0.1.0
> owner：Engineer / CEO / Test QA
> last_updated：2026-05-16
> source_of_truth：projects/aimandala/docs/qa/model-evals/2026-05-16-wealth-report-regression/README.md
> 对应任务：projects/aimandala/docs/tasks/2026-05-16-财富议题解读功能上线剩余任务计划.md

本目录用于执行财富议题解读功能 Phase 1：真实样例回归。

目标是用真实或接近真实的曼陀罗图片生成 Lite / Pro 报告，评估报告是否稳定围绕财富主线，是否能正确处理浮现议题，是否有越界表达。

## 1. 样例来源

第一轮先使用现有 fixture 图片做初筛：

```text
projects/aimandala/fixtures/toc-mvp/assets/
```

建议首批选择 5 张：

- `IMG_5057.jpeg`
- `IMG_5060.jpeg`
- `IMG_5063.jpeg`
- `IMG_5065.jpeg`
- `IMG_5067.jpeg`

后续如果 CEO 提供新的真实用户样例，应优先替换或追加到本目录。

## 2. 输出结构

每个 case 建议按以下结构保存：

```text
cases/
  wealth-case-001/
    source.md
    lite/
      agent_input.json
      final_report.md
      quality_gate.json
      report_context_package.json
    pro/
      agent_input.json
      final_report.md
      quality_gate.json
      report_context_package.json
    review.md
```

## 3. 评估维度

每份 Lite / Pro 报告都按 1 到 5 分评分：

- `visual_evidence_clarity`：画面依据是否清楚。
- `wealth_focus`：是否稳定围绕财富主线。
- `emergent_topic_translation`：浮现议题是否回译到财富。
- `lite_pro_separation`：Lite / Pro 差异是否清楚。
- `safety_boundary`：是否避免财务预测、心理诊断和职业决策建议。
- `handbook_feel`：是否像财富手册，而不是泛泛心理安慰。
- `user_value`：用户读完是否有帮助感。

## 4. 通过标准

单个 case 通过：

- Lite 和 Pro 的 `safety_boundary` 都 >= 5。
- Lite 和 Pro 的 `wealth_focus` 都 >= 4。
- Pro 的 `emergent_topic_translation` >= 4。
- 没有严重越界问题。

阶段通过：

- 5 到 10 个 case 中，80% 以上通过。
- 失败 case 都有明确归因。
- 失败归因已经回写到知识库、routing、模板或质量门的后续任务中。

## 5. 失败归因分类

失败原因统一归到以下类别：

- `vision_evidence_issue`：视觉观察不清楚或不准确。
- `routing_issue`：画面信号没有命中合适财富条款。
- `clause_gap`：财富条款或浮现议题回译缺失。
- `template_issue`：报告模板无法组织出稳定结构。
- `writing_issue`：模型写作泛泛、跑偏或啰嗦。
- `safety_issue`：出现越界表达。
- `lite_pro_issue`：Lite / Pro 没有明显层次差异。

## 6. 当前执行状态

状态：first_pass_generated

已完成：

1. 选定第一批 5 张 fixture 图片。
2. 为每张图建立 case 记录。
3. dry-run 已通过，5 个 case 的 Lite / Pro 共 10 次计划运行都能解析到图片和输出目录。
4. 已使用真实模型生成 5 个 case 的 Lite / Pro 报告，共 10 份。
5. 10 份报告最终均通过质量门。
6. 已修正真实模型回归中暴露的质量门和视觉证据归一化问题。

下一步：

1. 人工复核 5 个 case 的报告内容。
2. 重点复核 `wealth-case-002` Lite 的报告厚度和用户价值。
3. 根据人工复核结果回写财富手册、routing、浮现议题回译或模板。
4. 再扩展到 10 到 20 个真实用户样例。

## 7. 执行命令

先验证 case 配置：

```bash
python3 projects/aimandala/toC/app/backend/scripts/run_wealth_report_regression.py --dry-run
```

跑单个 case：

```bash
python3 projects/aimandala/toC/app/backend/scripts/run_wealth_report_regression.py \
  --case-id wealth-case-001 \
  --mode both
```

跑全部 case：

```bash
python3 projects/aimandala/toC/app/backend/scripts/run_wealth_report_regression.py --mode both
```

说明：

- 真实执行需要先配置视觉模型和文字模型环境变量。
- 如果模型不可用，runner 会在对应 `lite/` 或 `pro/` 目录写入 `run_error.json`。

## 8. 当前前置条件

当前已完成一次真实模型连接和第一轮回归。

已验证的失败形态：

```json
{
  "status": "complete",
  "results": [
    {
      "case_id": "wealth-case-001",
      "mode": "lite",
      "status": "failed",
      "error": "vision_model_failed: empty or invalid stage-03 payload"
    }
  ]
}
```

历史失败说明 batch runner 本身可用；当前已完成真实模型配置验证。

### 8.1 需要补齐的环境变量

- `AIMANDALA_LLM_BACKEND`
- `AIMANDALA_LLM_BASE_URL`
- `AIMANDALA_LLM_API_KEY`
- `AIMANDALA_LLM_MODEL`
- `AIMANDALA_LLM_CHAT_MODEL`
- `AIMANDALA_LLM_VISION_MODEL`
- `AIMANDALA_LLM_TIMEOUT_SECONDS`
- `AIMANDALA_LLM_MAX_RETRIES`
- `AIMANDALA_REDEEM_CODES`

当前文本模型默认口径：

- `AIMANDALA_LLM_BASE_URL` 默认 `https://api.deepseek.com`
- `AIMANDALA_LLM_MODEL` 默认 `deepseek-v4-pro`
- 只设置 `AIMANDALA_LLM_API_KEY` 时，后端会自动启用 OpenAI-compatible 客户端。
- 视觉模型建议单独配置 `AIMANDALA_LLM_VISION_*`，避免把不支持图片输入的文本模型用于视觉观察。

### 8.2 当前结论

- 批量回归框架已就位。
- 5 个 case 的 Lite / Pro 报告已产出。
- 质量门通过率为 100%。
- 下一步需要人工内容复核，而不是继续处理模型连接问题。
