# QA

这里放 `一镜一梳` 当前主链路的正式验证基线与验证记录。

## 当前正式入口

当前只保留以下 QA 文档：

1. [2026-04-18-报告链路保真重构验证基线.md](2026-04-18-报告链路保真重构验证基线.md)
2. [2026-04-19-Batch-A-runtime-evidence-验证记录.md](2026-04-19-Batch-A-runtime-evidence-验证记录.md)
3. [2026-04-19-Batch-B-narrative-plan-验证记录.md](2026-04-19-Batch-B-narrative-plan-验证记录.md)
4. [2026-04-18-Lite-Pro-独立报告重定义验证记录.md](2026-04-18-Lite-Pro-独立报告重定义验证记录.md)

分工如下：

- `2026-04-18-报告链路保真重构验证基线.md`
  - 固定本轮重大重构的质量门、自动化验证矩阵和样本验证矩阵
- `2026-04-19-Batch-A-runtime-evidence-验证记录.md`
  - 固定 Batch A runtime evidence 重构的执行结果、样本观察和放行结论
- `2026-04-19-Batch-B-narrative-plan-验证记录.md`
  - 固定 Batch B narrative plan、prompt skeleton 和 debug 收口的执行结果与放行结论
- `2026-04-18-Lite-Pro-独立报告重定义验证记录.md`
  - 固定 `Lite / Pro` 独立 SKU、Lite 轻疗愈区块和 `Pro` 独立入口语义的验证结果

## 使用规则

- 进入验证前，先对齐 [../specs/2026-04-18-报告链路保真重构总规格.md](../specs/2026-04-18-报告链路保真重构总规格.md)
- 执行验证时，按基线中的自动化与样本矩阵回写结果
- 交付时，将最终结论同步到 [../delivery/README.md](../delivery/README.md)
