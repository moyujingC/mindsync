# Git 仓库管理系统说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-02
> source_of_truth：company/Git仓库管理系统说明.md

这份文档定义 `MindSync` 当前的公司级 Git 仓库管理系统。

这里说的“仓库管理系统”，不是指某个 Git 平台按钮怎么点，而是指公司内部当前采用的整套仓库组织方式，包括但不限于：

- `Monorepo`（单仓多项目）
- `git worktree`（Git 工作树）
- 分支与主干口径
- 公司级与项目级目录分层
- 历史仓库与当前主入口的关系
- 本地执行与服务器执行的仓库路径语义
- 提交纪律与自动提交辅助机制

这份文档的作用，是作为公司级总入口：

- 只保留整体口径
- 不重复项目映射细节
- 不重复 Monorepo 目录细节
- 不重复提交机制实现细节

## 1. 一句话定义

`mindsync` 当前采用的是：

- 一个公司级主仓库 `mindsync`
- 以 `Monorepo` 为主结构
- 以 `git worktree` 作为多项目并行开发和多执行链隔离的辅助机制
- 以公司治理文档作为长期规则源
- 以 `Paperclip` 作为运行时控制面，而不是仓库主入口

更直白一点说：

`mindsync` 是主系统，`git worktree` 是分工作台，`Paperclip` 是任务控制台。

## 2. 这套系统解决什么问题

如果没有这套仓库管理系统，信息和实现会散到很多地方：

- 多个历史仓库
- 临时 worktree
- 聊天记录
- shell 历史
- Paperclip 运行态对象
- 服务器上的共享 checkout

结果通常会变成：

- 不知道哪个公司级规则该改在哪里
- 不知道项目实现应该落在哪个目录
- 不知道某个 worktree 只是临时开发台，还是正式运行路径
- 不知道服务器上的 checkout 是主镜像区、巡检区，还是隔离执行区
- 不知道某个历史仓库是否还算正式主入口

这套管理系统的目标，就是把这些问题统一收口。

## 3. 当前采用的总结构

### 3.1 主仓库

当前公司级主仓库是：

- `mindsync`

它同时承担两层角色：

1. 公司内核仓库
2. 多项目 `Monorepo`

这意味着它不是“某个单一应用项目的代码仓库”，而是：

- 公司治理源
- 角色定义源
- 项目入口源
- 共享工具源
- 长期知识源

### 3.2 Monorepo 的定位

当前主仓采用 Monorepo 结构，但目录分层细节不在这里重复展开。

正式目录分层说明看：

- [MONOREPO.md](MONOREPO.md)

### 3.3 历史仓库的定位

当前默认口径是：

- 历史独立仓库只作为迁移来源或归档参考
- 不再作为正式主入口

也就是说，如果一个项目已经正式收束进 `mindsync/projects/`，那么后续默认应以 `mindsync` 为准，而不是继续把历史独立仓库当主线。

## 4. Git worktree 在这里扮演什么角色

`git worktree` 可以通俗理解为：

在同一个 Git 仓库主历史下，额外开出多个并行工作台，每个工作台可以对应不同分支、不同任务、不同执行链。

在 `墨予镜` 当前体系里，`git worktree` 主要承担三类角色：

### 4.1 本地多项目开发工作台

例如：

- `aimandala/dev`
- `relayhub/dev`
- `content-matrix/dev`
- `research-center/dev`
- `xinran-jobhunt/dev`

这些 worktree 的意义不是替代主仓，而是让不同项目能有稳定、独立、不互相打架的开发台。

### 4.2 运行时隔离工作台

例如服务器上的：

- `/opt/automation/worktrees/...`

它的意义是：

- 会写文件的自动化执行，不再共享同一个 checkout
- 每条任务或每类任务，尽量落到自己的隔离 worktree

### 4.3 本地自动执行的 runtime worktree

对部分本地自动执行场景，worktree 还承担：

- 给本地执行器提供稳定可运行 checkout
- 避免直接占用用户手工开发中的主工作区

## 5. 什么时候该用主仓，什么时候该用 worktree

### 5.1 主仓（main checkout）更适合做什么

主仓更适合承担：

- 公司治理文档维护
- 公司注册表与入口维护
- Automation、运行机制、系统说明这类总线级改动
- 最终收口后的稳定主干内容

### 5.2 worktree 更适合做什么

worktree 更适合承担：

- 某个项目的独立连续开发
- 某条分支的实验、验证和迭代
- 与其他项目并行进行、不希望互相污染的开发任务
- 自动化执行链里的隔离写操作

### 5.3 不该把 worktree 当成什么

不应把 worktree 当成：

- 另一个独立仓库
- 长期脱离主仓治理的平行世界
- 可以无纪律长期堆脏改的“临时垃圾场”

worktree 只是工作台，不是新公司。

## 6. 当前分支与 worktree 的正式口径

### 6.1 主干口径

当前根工作区默认对应：

- `main`

`main` 的定位不是承接所有高频试错，而是：

- 公司主干
- 治理主干
- Automation 和最终收口主干

这里要特别避免一个常见误解：

- `main` 不是所有项目的默认日常开发分支
- `main` 也不是所有项目都要先合入才允许做服务器测试的前置分支

GitHub / Git 的正式理解应是：

- `main`
  - 负责公司级文档、治理规则、Automation、共享脚本与跨项目稳定收口
- 项目开发分支
  - 负责各自项目的日常开发、验证和节奏推进
- `worktree`
  - 只是这些分支在本地或服务器上的独立工作台，不改变分支本身的治理语义

### 6.2 项目 worktree 口径

当前已经明确采用独立 worktree 的项目，应固定对应自己的开发分支。

例如：

- `relayhub/dev`
- `aimandala/dev`
- `content-matrix/dev`
- `research-center/dev`
- `xinran-jobhunt/dev`

意思是：

- 项目默认在自己的 worktree 上做日常开发与验证
- 成熟后再按规则合回主干

当前推荐口径再往前收一层：

- `aimandala/dev`
  - 作为 `AI Mandala` 默认开发主线
- `relayhub/dev`
  - 作为 `RelayHub` 长期服务器测试分支和内部部署主线
- 其他项目
  - 采用 `<project>/dev` 作为长期开发分支时，也应明确写入各自项目入口文档

任务分支默认从项目开发分支分出，例如：

- `feature/*`
- `fix/*`
- `codex/*`
- `chore/*`

除非任务本身属于公司治理、Monorepo 治理或共享基础设施收口，否则不建议直接从 `main` 分出项目实现线。

### 6.3 服务器 worktree 口径

服务器上的 `/opt/automation/worktrees` 不是“另一个项目目录”，而是：

- automation 节点的隔离执行区

只有符合服务器可写执行语义的任务，才允许落进去。

## 7. 公司级仓库边界

当前需要同时区分 4 种路径语义：

### 7.1 公司主仓路径

例如：

- `mindsync`

表示公司级主工作区和 Monorepo 根。

### 7.2 本地项目 worktree 路径

例如：

- `mindsync-worktrees/...`
- 或后续 runtime worktree 根

表示本地项目独立开发工作台。

## 8. GitHub 使用流程

GitHub Actions 不会识别“你是从哪个 `worktree` 推上去的”。

它只识别：

- `push`
- `pull_request`
- `workflow_dispatch`
- `schedule`
- 对应的 `branch`
- 对应的 `paths`

所以当前正式流程应围绕“分支职责”设计，而不是围绕“worktree 数量”设计。

### 8.1 公司治理 / Monorepo 治理

- 默认基于 `main` 推进
- 适合内容：
  - 公司级治理文档
  - 仓库协作规则
  - Automation 收口
  - 跨项目共享脚本与共享规范
- 完成后直接进入 `main`

### 8.2 AI Mandala

- 日常开发：
  - 在 `aimandala/dev` 或其任务分支推进
- 任务级收口：
  - 任务分支先合回 `aimandala/dev`
- 阶段性收口：
  - 再由 `aimandala/dev` 合回 `main`
- 正式发布：
  - 由既定发布流程进入 `release`

### 8.3 RelayHub

- 日常开发：
  - 在 `relayhub/dev` 或其任务分支推进
- 内部试用与服务器测试：
  - 统一收口到 `relayhub/dev`
- 当前不要求：
  - 先并回 `main` 才允许部署
- 当前也不要求：
  - 为 `RelayHub` 额外拆出仓库级 `release` 轨

### 8.4 分支之间的默认合并同步

当前默认采用“项目分支定期回主干”的策略：

- `项目任务分支 -> 项目开发分支`
  - 作为日常默认收口路径
- `项目开发分支 -> main`
  - 作为阶段性、稳定点收口路径
- `main -> 项目开发分支`
  - 不做高频同步
  - 仅在项目明确依赖主干新治理、新共享脚本或分叉过大时回灌
- `main -> release`
  - 当前只保留给 `AI Mandala` 既有发布语义
- `relayhub/dev -> main`
  - 定期但不高频
  - 只在阶段能力稳定后回收

### 7.3 服务器主镜像区 / 巡检区

例如：

- `/opt/automation/app/mindsync`
- `/opt/automation/app/mindsync-heartbeat`

它们的语义不是“默认写入区”，而是：

- 主镜像参考区
- 巡检参考区

### 7.4 服务器隔离执行区

例如：

- `/opt/automation/worktrees`

它的语义是：

- 真正允许服务器写文件的隔离执行工作区

## 8. 提交纪律在这套系统里的位置

这套仓库管理系统不只关心“目录怎么摆”，还关心“改动怎么收口”。

当前统一纪律是：

1. 改完即提交
2. 适用于所有分支、所有本地 `git worktree`
3. 若当前工作区已有他人改动，只提交自己本轮负责文件
4. 不把长期脏工作区当默认工作方式

这条纪律的目的，是避免：

- worktree 越开越多，但没人知道哪个是干净的
- 分支越分越细，但没有稳定收口
- 本地、服务器、自动执行链都遗留半成品改动

自动提交辅助机制和提交边界的正式说明，仍以：

- [company/Git提交与自动提交规范.md](company/Git提交与自动提交规范.md)

为准。

## 9. 与 Paperclip 的关系

这里有一个很容易混淆的点：

`Paperclip` 可以管理 `workspace`，但它不是公司 Git 仓库管理系统本身。

更准确的分工是：

- `MindSync / 公司治理文档`
  - 定义公司级仓库口径
- `Git`
  - 承担真实版本历史、分支、worktree 和提交
- `Paperclip`
  - 承担运行时控制面、任务派发和 workspace 运行态映射

所以当你在面板里看到 workspace 时，不要自动等价成：

- 公司仓库结构已经合理
- execution workspace 一定真的落实
- worktree 一定被正确使用

面板配置只是运行态的一部分，不是全部真相。

## 10. 当前最常见的误区

### 10.1 把历史仓库继续当主入口

如果项目已经正式收束进 `mindsync`，就不应继续把历史独立仓库当默认主线。

### 10.2 把 worktree 当成独立仓库

worktree 是同一仓库的不同工作台，不是新仓库，不应自己发展出一套脱离主仓治理的规则。

### 10.3 把服务器主镜像区当默认写入区

`/opt/automation/app/mindsync` 这类路径不应继续被当成真实自动化写操作的默认落点。

### 10.4 把“开了 workspace”当成“仓库系统已经治理好”

不是。

仓库系统治理好，至少还要包括：

- 真实路径分层清楚
- worktree 语义清楚
- 提交纪律稳定
- 运行时不再漂移

## 11. 当前推荐阅读顺序

如果你要理解公司级 Git 仓库管理系统，建议按这个顺序看：

1. [MONOREPO.md](MONOREPO.md)
2. [company/项目与仓库映射.md](company/项目与仓库映射.md)
3. [company/Git提交与自动提交规范.md](company/Git提交与自动提交规范.md)
4. [company/服务器与基础设施入口.md](company/服务器与基础设施入口.md)
5. [company/projects/Automation/PROJECT.md](company/projects/Automation/PROJECT.md)

如果你要判断 `Paperclip workspace / execution workspace / git worktree` 是否已经真正用透，再继续看：

- [company/knowledge-base/system/Paperclip-workspace-充分使用度检查表.md](company/knowledge-base/system/Paperclip-workspace-充分使用度检查表.md)
