# 本地自动执行 runtime 迁出 Downloads 交付记录

> 状态：current
> 版本：0.1.0
> owner：Engineer
> 最后更新：2026-04-28
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/company/projects/Automation/2026-04-28-本地自动执行-runtime-迁出-Downloads-DELIVERY.md
> 项目：Automation Platform
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/company/projects/Automation/2026-04-27-项目工作区与执行工作区分层-SPEC.md
> depends_on：/Users/xinran/Downloads/dev/mindsync/company/projects/Automation/2026-04-27-本地执行器优先本地-worktree-IMPLEMENTATION.md
> depends_on：/Users/xinran/Downloads/dev/mindsync/company/projects/Automation/2026-04-27-本地执行器-CLI-依赖缺口记录.md

## 1. 问题定义

`launchd`（macOS 后台任务管理）启动本地自动执行器时，持续报：

- `getcwd: cannot access parent directories: Operation not permitted`
- `bash: /Users/xinran/Downloads/.../paperclip-local-env.sh: Operation not permitted`

根因不是 `Paperclip CLI` 本身失效，而是后台进程直接访问 `Downloads` 目录下的脚本与仓库时，被系统权限模型拦住。

## 2. 本轮动作

### 2.1 新建 runtime 根目录

在用户主目录下建立稳定运行时目录：

- `/Users/xinran/.mindsync/runtime-anchor`
- `/Users/xinran/.mindsync/runtime/mindsync`
- `/Users/xinran/.mindsync/runtime/paperclip`
- `/Users/xinran/.mindsync/worktrees`

这样后台任务后续只访问 `~/.mindsync/...`，不再直接依赖 `Downloads`。

### 2.2 补齐 runtime worktree

新增以下本地执行 worktree：

- `/Users/xinran/.mindsync/worktrees/aimandala-dev`
- `/Users/xinran/.mindsync/worktrees/relayhub-dev`
- `/Users/xinran/.mindsync/worktrees/xinran-jobhunt-dev`

对应分支：

- `runtime/aimandala-dev`
- `runtime/relayhub-dev`
- `runtime/xinran-jobhunt-dev`

说明：

- 这里用 `runtime/*` 命名空间，是为了不与用户自己在 `Downloads` 目录下已有的正式 worktree 冲突
- 本地自动执行只需要一个稳定可运行的 checkout，不要求与用户手工开发 worktree 复用同一路径

### 2.3 切换本地执行链 fallback

以下脚本的 repo-local fallback（仓库内兜底 CLI）都已改为优先使用：

- `/Users/xinran/.mindsync/runtime/paperclip`

涉及文件：

- [shared/tools/paperclip-local-env.sh](/Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-local-env.sh)
- [shared/tools/paperclip-local-executor.mjs](/Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-local-executor.mjs)
- [shared/tools/paperclip-local-pilot.mjs](/Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-local-pilot.mjs)

### 2.4 切换 launchd 入口

`launchd` 现在改为：

- working directory：`/Users/xinran/.mindsync/runtime-anchor`
- env script：`/Users/xinran/.mindsync/runtime/mindsync/shared/tools/paperclip-local-env.sh`
- executor script：`/Users/xinran/.mindsync/runtime/mindsync/shared/tools/paperclip-local-executor.mjs`

涉及文件：

- [shared/tools/paperclip-local-executor.launchd.plist](/Users/xinran/Downloads/dev/mindsync/shared/tools/paperclip-local-executor.launchd.plist)
- [shared/tools/install-paperclip-local-executor-launchd.sh](/Users/xinran/Downloads/dev/mindsync/shared/tools/install-paperclip-local-executor-launchd.sh)

### 2.5 增加 runtime 脚本同步

安装 `launchd` 前，安装脚本会先把根工作区的 `shared/tools/` 同步到：

- `/Users/xinran/.mindsync/runtime/mindsync/shared/tools`

这样避免出现：

- 根工作区脚本已更新
- 但后台仍继续跑旧 runtime checkout 脚本

## 3. 远程项目 workspace 调整

本轮只调整本地相关 workspace，不改服务器 primary：

- `moyujing-ip-local-company` -> `/Users/xinran/.mindsync/runtime/mindsync/company/projects/墨予镜IP`
- `aicareer-local-monorepo` -> `/Users/xinran/.mindsync/runtime/mindsync/projects/aicareer`
- `research-center-local-monorepo` -> `/Users/xinran/.mindsync/runtime/mindsync/projects/research-center`
- `xinran-jobhunt-local-monorepo` -> `/Users/xinran/.mindsync/runtime/mindsync/projects/xinran-jobhunt`
- `xinran-jobhunt-local-worktree` -> `/Users/xinran/.mindsync/worktrees/xinran-jobhunt-dev/projects/xinran-jobhunt`
- `aimandala-local-monorepo` -> `/Users/xinran/.mindsync/runtime/mindsync/projects/aimandala`
- `aimandala-local-worktree` -> `/Users/xinran/.mindsync/worktrees/aimandala-dev/projects/aimandala`
- `relayhub-local-monorepo` -> `/Users/xinran/.mindsync/runtime/mindsync/projects/relayhub`
- `relayhub-local-worktree` -> `/Users/xinran/.mindsync/worktrees/relayhub-dev/projects/relayhub`

保留不变：

- 各项目 `/opt/automation/...` 的服务器 primary workspace

## 4. 验证结果

### 4.1 runtime 命令行验证

以下命令已通过：

```bash
eval "$(/Users/xinran/.mindsync/runtime/mindsync/shared/tools/paperclip-local-env.sh engineer)" \
  && node /Users/xinran/.mindsync/runtime/mindsync/shared/tools/paperclip-local-executor.mjs doctor --json
```

```bash
eval "$(/Users/xinran/.mindsync/runtime/mindsync/shared/tools/paperclip-local-env.sh engineer)" \
  && node /Users/xinran/.mindsync/runtime/mindsync/shared/tools/paperclip-local-executor.mjs poll-once --json
```

观察到：

- 能成功拿到远程 agent 身份
- 能成功读取远程控制面 issue
- 仍正确跳过 `server_automation` 与 `automation-summary`

### 4.2 launchd 验证

重新安装并 `kickstart` 后：

- `launchctl print gui/501/com.moyujing.paperclip-local-executor`
- 状态为 `running`
- `last exit code = 0`

说明：

- 本地自动执行器已经可以作为后台进程活着跑起来
- 历史 `stderr` 里的 `Downloads` 权限报错可视为旧日志，不再代表当前配置

## 5. 当前残留风险

1. runtime `mindsync` checkout 目前是单独 clone，不会自动跟随根工作区的所有内容变化
2. 当前只保证 `shared/tools/` 在安装 `launchd` 时会同步；其他目录若需要后台直接读，后续还要继续定义同步策略
3. `墨予镜IP` 现在的 local company workspace 已指向 runtime 路径，若未来还要补更多 company 侧本地入口，应继续沿用同一策略

## 6. 下一步建议

1. 若要让 runtime checkout 长期稳定，可补一个专门的 runtime 同步脚本，而不是只在 `launchd install` 时同步 `shared/tools/`
2. 若后续本地执行任务要直接在 runtime worktree 内提交代码，应继续定义 runtime 分支回流主仓的规则
3. 若未来新增需要本地自动执行的新项目，默认先补：
   - runtime monorepo workspace
   - runtime worktree workspace
   - 远程项目本地 workspace 映射
