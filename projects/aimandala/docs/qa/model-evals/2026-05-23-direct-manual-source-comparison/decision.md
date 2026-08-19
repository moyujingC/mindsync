> 状态：historical-reference
> 版本：0.1.0
> source_of_truth：自动补齐

# 直给手册原文方案对照结论

## 对照对象

1. 当前结构化链路
2. 直接给完整手册原文的直出链路
3. 直出链路中的 `thinking=off`
4. 直出链路中的 `thinking=on`

## 实验结果

### 1. 结构化链路

- 优点：视觉证据拆得稳，便于回归测试和后续分层。
- 缺点：报告语气更像系统写作，疗愈师带读感不足。

### 2. 直给手册原文

- 优点：更贴手册流派，视觉识别更连贯，报告更像人写。
- 缺点：结构可控性弱一些，需要把输出边界收紧。

### 3. `thinking=off`

- 表现更收敛。
- 文本更像按手册直接写，不容易发散。
- 更适合作为当前 MVP 的默认实验配置。

### 4. `thinking=on`

- 输出更长。
- 更容易扩成解释性文字。
- 没看到比 `thinking=off` 更稳定的视觉收益。

## 结论

当前阶段，报告写作层更适合走“完整手册原文 + 少量任务约束”的直出路线。

更具体地说：

- 结构化视觉层继续保留
- 报告生成层改为直连手册原文
- 默认先用 `thinking=off`
- `thinking=on` 只保留给后续专项测试

## 对现有链路的影响

不是要马上废掉所有结构化步骤，而是要把它们重新放回合适的位置：

- 视觉识别：继续保留结构化中间层
- 报告写作：优先测试直出方案
- 质量门：继续保留，用来防止跑偏

## 当前建议

先不要继续细抠 prompt 规则，先把“直给手册原文”的报告写作路线当作正式候选。
如果后续再做优化，优先优化的是：

1. 输入组织方式
2. 输出边界
3. 报告结构锚点

而不是再加一层层硬性限制。

## 产物路径

- `projects/aimandala/toC/app/backend/scripts/run_manual_source_wealth_report_experiment.py`
- `/tmp/aimandala-manual-source-wealth-report`
- `/tmp/aimandala-manual-source-wealth-report-thinking-on`
