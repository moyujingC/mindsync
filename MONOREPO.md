# MindSync Monorepo 说明

> 状态：draft
> 最后更新：2026-04-04

这份文档定义 `mindsync` 作为 `墨予镜` Monorepo 的顶层结构、目录归属和迁移原则。
它只回答两个问题：

- 各类对象应该放在哪一层
- 目录如何保持长期可维护

对象主数据不在这里维护，而以 [company/项目注册表.yaml](/Users/xinran/Downloads/dev/mindsync/company/项目注册表.yaml) 为准。

## 1. 目标

把原来分散在公司内核仓库与多个项目仓库中的长期资产，逐步收束到一个可维护、可治理、可被 Paperclip 直接调度的工作区中。

Monorepo 的目标不是把所有东西混在一起，而是做到：

- 一个仓库承载公司内核与项目工作区
- 不同层级信息各有唯一入口
- 项目实现可以独立演进，但共享规则、模板和工具
- Agent 可以稳定地从统一入口定位公司级和项目级上下文

## 2. 顶层目录约定

- `agents/`
  - 角色定义与角色本地运行时入口
- `company/`
  - 公司级治理、蓝图、研究沉淀、项目映射
  - 其中 `company/knowledge-base/` 用于收口公司级长期知识与系统机制解释
- `projects/`
  - `product` 类型对象的实际工作区与项目级入口
- `shared/`
  - 共享脚本、模板、工具与跨项目可复用资源
- `external/`
  - 外部参考资料或迁移期间的外部依赖参考

## 3. 对象类型约定

当前公司至少存在以下对象类型：

- `product`
  - 面向外部用户或服务场景的正式产品项目
- `capability`
  - 为多个项目和多个 Agent 提供共享能力的长期底座
- `brand`
  - 对外叙事、内容放大与身份表达的长期载体

当前阶段仍允许 `capability` 或 `brand` 暂时以 `projects/` 下工作区的形式存在。
这样做是为了兼容现有 Paperclip 工作方式和现有路径约定，不强行在本轮整改中改目录。

## 4. 项目目录约定

每个项目在 `projects/<project-slug>/` 下至少应具备：

1. `PROJECT.md`
2. `README.md` 或等价入口说明
3. 项目实现目录
4. 项目专属文档目录
5. 如有需要，再补测试、脚本、资产等子目录

对 `product` 类型，建议逐步统一为：

- `specs/`
- `tasks/`
- `decisions/`
- `qa/`
- `delivery/`
- `notes/`

对 `capability` 类型，建议逐步统一为：

- `research/`
- `kb/`
- `specs/`
- `tasks/`
- `delivery/`
- `notes/`

对 `brand` 类型，建议逐步统一为：

- `content/`
- `profile/`
- `assets/`
- `notes/`
- `delivery/`

公司侧与项目侧分工如下：

- `company/projects/<项目名>/`
  - 保留公司视角下的项目定位、研究结论、任务纪要、内容资产入口
- `projects/<project-slug>/`
  - 保留项目工作区、项目实现、项目专属需求与交付文档

## 5. 当前对象落位原则

- `一镜一梳`
  - 类型：`product`
  - 公司侧入口：`company/projects/一镜一梳/`
  - 项目工作区：`projects/aimandala/`
  - 历史来源：`/Users/xinran/Downloads/dev/ai-mandala`
- `怀瑾握瑜`
  - 类型：`product`
  - 公司侧入口：`company/projects/怀瑾握瑜/`
  - 项目工作区：`projects/aicareer/`
  - 历史来源：`/Users/xinran/Downloads/dev/ai-career`
- `馨冉求职`
  - 类型：`product`
  - 公司侧入口：`company/projects/馨冉求职/`
  - 项目工作区：`projects/xinran-jobhunt/`
  - 历史来源：无，直接在 Monorepo 内立项
- `研究中心`
  - 类型：`capability`
  - 公司侧入口：`company/projects/研究中心/`
  - 项目工作区：`projects/research-center/`
  - 历史来源：无，直接在 Monorepo 内启动
- `RelayHub`
  - 类型：`capability`
  - 公司侧入口：`company/projects/RelayHub/`
  - 项目工作区：`projects/relayhub/`
  - 历史来源：无，直接在 Monorepo 内启动

更完整的对象清单、状态、入口路径与历史来源，以 `company/项目注册表.yaml` 为准。

## 6. 迁移原则

1. 先建立稳定入口，再迁移实现内容。
2. 先迁项目文档和工作约束，再迁代码与脚本。
3. 公司级文档不进入项目目录，项目实现不反向塞入 `company/`。
4. 迁移期间保留历史来源说明，但不把历史仓库继续当成主入口。
5. 每次迁移都要同步更新 `company/项目注册表.yaml`、项目 `PROJECT.md` 与必要的 Paperclip 配置。

## 7. 当前整改范围

本轮整改只完成：

- Monorepo 治理口径对齐
- 对象分型显式化
- 单一真相注册表落地
- 顶层目录骨架建立
- 项目入口文件建立
- `怀瑾握瑜` 的流程化项目骨架建立

本轮不直接完成：

- 外部仓库代码全量迁入
- 构建系统统一
- 跨项目依赖抽取
