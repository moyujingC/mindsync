# Runbooks

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/runbooks/README.md

这里放 `一镜一梳 / aimandala` 的运行说明、联调手册和操作型 runbook。

它回答的问题是：

- 本地怎么跑
- 前后端怎么接
- 联调时先看什么
- 线上运维和质量门如何执行

## 1. 适合放在这里的内容

- 本地联调手册
- 开发环境启动说明
- 运维 runbook
- PR 质量门 runbook
- 发布与排障操作手册

## 2. 不适合放在这里的内容

- 功能定义
- 架构边界
- 一次性整改计划
- 验收结论

这些内容应分别留在：

- `../specs/`
- `../architecture/`
- `../tasks/`
- `../qa/`

## 3. 当前重点入口

1. [开发与联调总入口.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/runbooks/开发与联调总入口.md)
2. [本地联调手册.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/runbooks/本地联调手册.md)
3. [../tasks/2026-04-10-服务器部署与运维手册.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md)
4. [../tasks/aimandala-pr-质量门-runbook.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/aimandala-pr-质量门-runbook.md)

## 4. 当前治理判断

历史上 `aimandala` 的 runbook 类内容混在 `tasks/` 和代码 README 中。

当前先建立本目录作为正式入口：

- 新增运行说明优先落到这里
- 历史文档先保留原路径，通过索引收口
- 后续再按需要做目录迁移
