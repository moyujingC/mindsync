# 运行时知识包

> 状态：draft
> 版本：0.1.2
> date：2026-05-15
> owner：CEO / Knowledge Base
> source_of_truth：当前目录/60-运行时知识包/README.md

本目录后续保存产品运行时使用的知识包。

可能包含：

- schema。
- pack。
- index。
- 检索配置。
- 版本 diff。

运行时知识包应由经过审核的自然语言知识和结构化知识单元生成，不直接手写大量临时数据。

## 当前可用包

- [10-aimandala-解读报告生成最小包.md](10-aimandala-解读报告生成最小包.md)：当前第一版报告生成入口，先覆盖主题确认、三圈解读、综合判断和调整建议。
- [../50-结构化知识单元/10-aimandala-report-generation.yaml](../50-结构化知识单元/10-aimandala-report-generation.yaml)：对应的第一版结构化知识单元，供程序或运行时编译使用。
- [20-aimandala-report-runtime-index.yaml](20-aimandala-report-runtime-index.yaml)：最小 runtime 检索顺序与组合规则。
- [../50-结构化知识单元/40-wealth-report-routing.yaml](../50-结构化知识单元/40-wealth-report-routing.yaml)：财富主题报告 routing 单元，供 `user_theme: 财富` 时二级检索使用。
