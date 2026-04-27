# RelayHub v1 VS Code Claude Code 本地接入 Runbook

## 1. 适用范围

这份 runbook 只服务当前 `RelayHub` 的默认本地主路径：

- `VS Code / Claude Code`
- 本地 `dev-relay`

不在这份 runbook 范围内的内容：

- `Paperclip claude_local`
- release 部署
- `Codex relay` 恢复开发

## 2. 当前唯一默认口径

当前本机 `Claude Code` 的唯一推荐入口是：

- `projects/relayhub/dev-relay/run-claude-code-with-relay.sh`

当前 `mindsync` 项目的共享默认配置还应收口到：

- `.claude/settings.json`

默认行为固定为：

- `ANTHROPIC_BASE_URL=http://127.0.0.1:4319`
- `ANTHROPIC_API_KEY=relayhub-local-dev-relay`
- `ANTHROPIC_AUTH_TOKEN=relayhub-local-dev-relay`
- `ANTHROPIC_MODEL=relayhub-task-claude-code`
- `ANTHROPIC_DEFAULT_OPUS_MODEL=relayhub-task-claude-code`
- `ANTHROPIC_DEFAULT_SONNET_MODEL=relayhub-task-claude-code`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL=relayhub-task-claude-code`
- 默认追加 `--setting-sources local`
- 如当前 `Claude Code` 版本支持，才会追加 `--bare`

这套口径的目的很简单：

- 让 `Claude Code` 固定命中本地 `dev-relay`
- 避免用户级 `~/.claude/settings.json` 把请求带去别的上游
- 保证后续请求统一跟随 `task-claude-code` 当前绑定
- 让同一个 `mindsync` 仓库下的其他 workspace 也继承同一套 `Claude Code` 项目级配置

## 3. 使用前提

先确保本地已启动：

- `control-plane`
- `dev-relay`

当前这台机器上的最短启动方式固定为：

```bash
cd projects/relayhub/control-plane && npm start
cd projects/relayhub/dev-relay && npm start
```

并确认：

- `task-claude-code` 存在
- `task-claude-code.defaultModelEntryId` 已绑定到一个已测试成功的可用入口

当前默认还要记住：

- `Codex relay` 默认关闭
- 只有显式设置 `RELAYHUB_ENABLE_CODEX_RELAY=1` 才会恢复
- 这不会影响当前 `Claude Code` 主路径

## 4. 前台手工 smoke

先用前台命令确认本地主链路是通的：

```bash
bash projects/relayhub/dev-relay/local-claude-code-cli-smoke.sh
```

这一步会：

1. 读取 `task-claude-code` 当前绑定
2. 通过统一入口启动本机 `Claude Code`
3. 验证请求实际命中本地 `dev-relay`

如果当前绑定入口还没激活，这个 smoke 会直接报清楚原因，而不会再偷偷改绑到别的历史实验入口。

成功标准：

- 命令自然完成
- 返回不是本地报错或挂起
- 请求没有被用户级 `~/.claude/settings.json` 覆盖

## 5. 后台 VS Code / 常驻进程口径

如果你是在 `VS Code` 里使用 `Claude Code`，重点不是手工再改很多地址，而是保证宿主进程继承同一套环境。

当前正式要求是：

- 不要只改单个 `ANTHROPIC_BASE_URL`
- 要通过统一入口一次性导出完整 `ANTHROPIC_*`
- 默认保留 `--setting-sources local`
- `mindsync` 仓库根 `.claude/settings.json` 作为项目级共享默认值

当前阶段的推荐做法是：

1. 先以前台 smoke 确认 relay 主链路正常
2. 先看模板文件：
   - `projects/relayhub/dev-relay/claude-code-relay.env.example`
   - `projects/relayhub/dev-relay/vscode-settings.template.json`
   - `projects/relayhub/dev-relay/setup-vscode-claude-code-env.example.sh`
3. 把 `vscode-settings.template.json` 中需要的字段复制到你本地工作区的 `.vscode/settings.json`
4. 跑一次只读检查：

```bash
bash projects/relayhub/dev-relay/check-vscode-claude-code-env.sh
```

5. 如果只想先在当前 shell 里模拟同一套环境，可以先执行：

```bash
source projects/relayhub/dev-relay/setup-vscode-claude-code-env.example.sh
```

6. 再让你的本地 `Claude Code` 使用与统一入口相同的环境口径
7. 如果后台进程行为和前台不一致，优先排查是否仍受用户级 `~/.claude/settings.json` 或旧环境变量污染

### 5.0 当前这台机器的最短可用步骤

今天要尽快在这台 Mac 上顺手用起来，推荐按这条最短路径走：

1. 启动本地 `control-plane`
2. 启动本地 `dev-relay`
3. 确认仓库根 `.claude/settings.json` 已存在
4. 确认 worktree 根 `.vscode/settings.json` 已落地
5. 确认 `~/.claude/settings.json` 不再保留 `env.ANTHROPIC_*` 冲突项
6. 跑 `bash projects/relayhub/dev-relay/check-vscode-claude-code-env.sh`
7. 跑 `bash projects/relayhub/dev-relay/local-claude-code-cli-smoke.sh`
8. 重载 `VS Code` 后再发起真实 `Claude Code` 请求

如果你打开的是同一个 `mindsync` 项目下的其他 workspace，这份仓库根 `.claude/settings.json` 应该继续提供同一套默认 relay 配置。

### 5.1 本机直接可用口径

如果目标是让当前这台机器尽快顺手可用，本轮正式默认动作是：

1. 在仓库根落地 `.claude/settings.json`
2. 在当前 workspace 根落地 `.vscode/settings.json`
3. 移除或清空 `~/.claude/settings.json` 里会覆盖 relay 的 `env.ANTHROPIC_*`
4. 启动本地 `control-plane`
5. 启动本地 `dev-relay`
6. 跑检查脚本
7. 跑 `local-claude-code-cli-smoke.sh`
8. 重载 `VS Code`

这轮文档收口的结论是：

- `CLI` smoke 是底层真链路验证
- 仓库根 `.claude/settings.json` 是 `mindsync` 级共享默认入口
- `VS Code` workspace 下的 `.vscode/settings.json` 是补充性的宿主兜底
- 不能把“单次 CLI 跑通”直接当成“后台 Claude Code 已稳定”

### 5.2 模板与本地文件的边界

这里要严格区分三类文件：

- 仓库根 `.claude/settings.json`
  - 项目级共享默认配置
  - 进入同一个 `mindsync` 仓库时应默认生效
- 仓库内可提交模板：
  - 只用于参考和复制
  - 不会自动改变你的 `VS Code`
- 你本地工作区下的 `.vscode/settings.json`
  - 这是实际宿主进程可能会读取的补充配置
  - 不提交到仓库

因此本轮正式口径不是“只靠某个 workspace 的 `.vscode` 文件”，而是“`mindsync` 根 `.claude/settings.json` + 本地 `.vscode/settings.json` 共同兜底”。

### 5.3 只读检查脚本

这轮新增的检查入口是：

```bash
bash projects/relayhub/dev-relay/check-vscode-claude-code-env.sh
```

默认会检查三层：

1. worktree 根 `.vscode/settings.json`
2. 当前 shell 的 `ANTHROPIC_* / RELAYHUB_*`
3. 用户级 `~/.claude/settings.json`

输出语义固定为：

- `ok`
- `warning`
- `fix next`

如果你不是在整个 worktree 根打开 `VS Code`，可以显式覆盖：

```bash
bash projects/relayhub/dev-relay/check-vscode-claude-code-env.sh --workspace-root /your/workspace/path
```

## 6. 切模型后的验证

如果你在 `/tasks` 页面改了 `Claude Code 当前模型`：

1. 切换 `task-claude-code.defaultModelEntryId`
2. 点击 `验证 Claude Code 当前模型`
3. 或重新跑一次本地 smoke

成功标准：

- 后续请求目标跟随新绑定变化
- 页面验证返回成功或可读错误

## 7. 本轮边界

这轮只解决：

- 本地开发期间，`Codex relay` 不再干扰日常使用
- `VS Code / Claude Code` 的默认本地主路径明确且可复用

这轮不解决：

- `Paperclip claude_local` 对齐到 `RelayHub`
- release 机器部署
- `Codex relay` 恢复为主路径
