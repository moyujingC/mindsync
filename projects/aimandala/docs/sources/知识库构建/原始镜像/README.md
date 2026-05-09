# 原始镜像说明

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-08
> 项目：aimandala
> 阶段：current
> source_of_truth：projects/aimandala/docs/sources/知识库构建/原始镜像/README.md
> depends_on：projects/aimandala/docs/sources/知识库构建/README.md

本目录是旧仓库 `知识库构建` 的原始镜像层。

## 1. 目录角色

这里保留的是原始资料的目录层级、文件名和正文内容，便于：

- 追溯流派来源
- 对照历史整理过程
- 校验当前运行时知识是否发生压缩或漂移

## 2. 使用边界

默认不要把本目录整体当成当前正式规则入口。

正式引用时应遵循：

1. 先看 [上级 README](../README.md)
2. 再看 [当前正式依据与使用说明.md](../当前正式依据与使用说明.md)
3. 最后进入本目录中的具体原始文件

## 3. 当前迁入规则

- 已按旧目录结构镜像迁入
- `.DS_Store` 已排除
- 图片和 JSON 评估产物已保留

本目录的存在不表示其中全部内容都自动升级为当前 `spec`、`architecture` 或运行时真理源。

## 4. 已知易干扰文件

以下文件保留为历史镜像，但默认不再作为当前方法依据：

- `00_kb_md/06_interpretation_methods.md`
  - 已作废。它把直断写成四步法第一步，并把直断写成切入点，容易误导报告生成。
- `00_kb_md/06_interpretation_methods_v2.md`
  - 过渡修正版。它仍保留旧阶段顺序痕迹，当前以 `../三圈五行流派解读方法与步骤.md` 为准。

如果搜索结果命中这些文件，应先回到上级目录的 `当前正式依据与使用说明.md` 判断是否可引用。
