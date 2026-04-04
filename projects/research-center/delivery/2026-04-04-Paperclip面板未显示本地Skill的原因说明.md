# Paperclip 面板未显示本地 Skill 的原因说明

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/delivery/2026-04-04-Paperclip面板未显示本地Skill的原因说明.md
> 项目：研究中心
> 阶段：delivery

这份文档用于解释一个容易混淆的问题：

- 为什么仓库里已经写好的 skill，没有直接出现在 Paperclip 面板里

## 1. 当前现象

- 角色 `AGENTS.md` 已经引用了 repo 内 skill
- 但 Paperclip 面板的 Skills 页，没有显示这些 skill 已挂到 agent 上

## 2. 原因

### 2.1 面板显示的是运行时挂载 skill

Paperclip 面板当前看到的 skill，本质上更接近：

- 已被运行时识别
- 已挂到 Claude skills home
- 或被 Paperclip 自己管理的 skills

### 2.2 我们当前完成的是 prompt / 方法层接入

目前已经完成的是：

- skill 本体落在 repo
- 角色 prompt 引用 skill
- 真实案例和 QA 复核完成

但这不自动等于：

- Paperclip 运行时已经安装这些 skill

### 2.3 当前 skill 不在 `~/.claude/skills/`

本机面板里当前看到的 user-installed skills，来自：

- `~/.claude/skills/`

而 `墨予镜` 当前首批 skill 默认落在：

- `projects/research-center/skills/`

两者不是同一个目录，也没有自动同步。

## 3. 当前结论

- skill 没有白写
- 只是当前处于：
  - 仓库治理层已完成
  - 运行时挂载层未自动接通

## 4. 当前处理策略

- repo 仍是 source of truth
- 如果要本机直接运行，就用本机挂载脚本同步到：
  - `~/.claude/skills/`
- 暂不为了这件事修改 Paperclip 内核

## 5. 一句话结论

当前面板没显示，不是因为 skill 没接，而是因为它们接在 repo 和 prompt 层，还没有自动进入 Paperclip / Claude 的运行时 skill 目录。
