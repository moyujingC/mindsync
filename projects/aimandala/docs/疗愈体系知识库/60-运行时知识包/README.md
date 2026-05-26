# 运行时知识包

> 状态：draft
> 版本：0.1.2
> date：2026-05-15
> owner：CEO / Knowledge Base
> source_of_truth：当前目录/60-运行时知识包/README.md

本目录保存产品运行时入口说明和部署生成包的使用边界。

可能包含：

- schema。
- pack。
- index。
- 检索配置。
- 版本 diff。

运行时入口应由经过审核的自然语言知识和部署生成包组成，不再直接依赖 YAML 结构化知识单元。

## 当前可用包

- [10-aimandala-解读报告生成最小包.md](10-aimandala-解读报告生成最小包.md)：当前第一版报告生成入口，先覆盖主题确认、三圈解读、综合判断和调整建议。
- [../30-应用适配/10-aimandala/06-财富议题解读报告模板.md](../30-应用适配/10-aimandala/06-财富议题解读报告模板.md)：财富主题报告的段落模板，供 `user_theme: 财富` 时组装输出顺序使用。
- 部署生成的 `app/core/mandala_interpretation_agent/generated_prompt_packs/*`：实际运行时读取的 prompt pack。
