# MindSync Monorepo 说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-02
> source_of_truth：MONOREPO.md

这份文档只回答一件事：

**`mindsync` 这个 Monorepo（单仓多项目）在结构上怎么分层。**

它不重复解释：

- Git 分支 / `git worktree`（Git 工作树）管理口径
- 历史仓库是否仍是主入口
- 各项目与历史仓库的一一映射

这些分别看：

- [company/Git仓库管理系统说明.md](company/Git仓库管理系统说明.md)
- [company/项目与仓库映射.md](company/项目与仓库映射.md)

## 1. 一句话定义

`MindSync` 是 `墨予镜` 的公司内核 + 多项目工作区 Monorepo。

它的目标不是把所有内容混在一起，而是让：

- 公司级治理
- 项目级实现
- 共享工具
- 长期知识

都落在同一个主仓库里，但仍保持边界清楚。

## 2. 顶层目录分层

当前默认分成五层：

### 2.1 `agents/`

- 角色定义
- 回答“谁负责做什么”

### 2.2 `company/`

- 公司级治理
- 注册表
- 蓝图
- 系统说明
- 公司知识库

回答“这家公司怎么运作”。

### 2.3 `projects/`

- 项目工作区
- 项目实现入口
- 项目专属文档

回答“这个项目具体怎么做”。

### 2.4 `shared/`

- 共享脚本
- 模板
- 跨项目工具

回答“多个项目共用什么工具链”。

### 2.5 `external/`

- 外部参考资料
- 迁移期依赖参考

## 3. 对象落位原则

当前公司至少存在三类长期对象：

- `product`
- `capability`
- `brand`

默认落位原则：

- 公司级规则、蓝图、注册表
  - 放 `company/`
- 项目实现与项目工作区
  - 放 `projects/`
- 跨项目共用脚本和模板
  - 放 `shared/`

当前阶段仍允许：

- `capability`
- `brand`

继续以 `projects/` 下工作区的形式存在，只要入口和语义清楚即可。

## 4. 项目目录的最低要求

每个 `projects/<project-slug>/` 至少应具备：

1. `PROJECT.md`
2. `README.md` 或等价入口
3. 项目实现目录
4. 项目专属文档目录

这条规则的目的不是统一所有项目长相，而是保证每个项目都有稳定入口。

## 5. 公司级与项目级的分工

### 5.1 公司级

放在：

- `company/`

主要承接：

- 治理规则
- 公司蓝图
- 项目注册表
- 系统机制说明
- 跨项目长期知识

### 5.2 项目级

放在：

- `projects/<project-slug>/`
- `company/projects/<项目名>/`

其中：

- `projects/<project-slug>/`
  - 项目工作区、项目实现、项目专属文档
- `company/projects/<项目名>/`
  - 公司视角下的项目定位、研究、纪要、内容资产入口

## 6. 当前使用原则

1. 公司级文档不塞进项目目录
2. 项目实现不反向塞进 `company/`
3. 主数据以 [company/项目注册表.yaml](company/项目注册表.yaml) 为准
4. 若结构说明与项目映射冲突，以注册表和项目入口文档为准

## 7. 推荐搭配阅读

- 仓库与 worktree 的总口径：
  - [company/Git仓库管理系统说明.md](company/Git仓库管理系统说明.md)
- 项目与历史仓库映射：
  - [company/项目与仓库映射.md](company/项目与仓库映射.md)
- 系统层解释：
  - [company/knowledge-base/system/MindSync-设计机制分析.md](company/knowledge-base/system/MindSync-设计机制分析.md)
