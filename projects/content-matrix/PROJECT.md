# 内容矩阵项目工作区

> 状态：current
> 版本：0.1.0
> owner：Content Lead / CEO
> last_updated：2026-04-30
> source_of_truth：projects/content-matrix/PROJECT.md
> 公司侧入口：[company/projects/内容矩阵/PROJECT.md](company/projects/内容矩阵/PROJECT.md)
> 项目类型：品牌 / 多账号内容矩阵工作区

这是 `内容矩阵` 在 Monorepo 中的正式项目工作区入口。

它用于承接 `内容矩阵` 的项目内执行材料、任务分解、验证记录和阶段交付。

## 1. 项目是什么

`内容矩阵` 不是单一账号，也不是单一产品。

它是公司内容系统的总项目工作区，负责把多个账号的内容协作正式落到 `projects/content-matrix/`。

它主要承接：

- 多账号内容规划
- 跨项目内容转译
- 内容治理规则的执行落地
- 与账号运营相关的阶段任务和交付

## 2. 与公司侧入口的分工

- [company/projects/内容矩阵/PROJECT.md](company/projects/内容矩阵/PROJECT.md)
  - 负责项目定义、边界、治理口径
- [projects/content-matrix/PROJECT.md](projects/content-matrix/PROJECT.md)
  - 负责项目内执行、任务运行与交付落地

简单说：

- `company/projects/内容矩阵/`
  - 更像“项目说明书”
- `projects/content-matrix/`
  - 更像“项目工作台”

## 3. 当前建议目录

随着项目推进，建议逐步建立：

- `specs/`
- `tasks/`
- `qa/`
- `delivery/`
- `notes/`

在这些目录尚未补齐前，这个 `PROJECT.md` 就是最小正式入口。

## 4. 与其他项目的关系

- 如果任务是账号矩阵、跨账号内容规划或内容治理，留在这里
- 如果任务只服务某个产品本身的产品定义或实现，回对应产品项目
- 如果任务是上游研究输入，优先从：
  - [projects/research-center/PROJECT.md](projects/research-center/PROJECT.md)
  handoff 到这里

## 5. 当前下一步

当前最小闭环建议是：

1. 补第一批 `tasks/`，把账号矩阵相关执行事项正式落地
2. 补 `delivery/`，承接阶段性内容规划与交付说明
3. 明确哪些任务留在公司侧治理文档，哪些任务进入项目工作区执行
