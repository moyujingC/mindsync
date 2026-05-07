# RelayHub v1 control-plane release 交付说明

> 状态：historical-reference
> 版本：0.1.1
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/relayhub/delivery/2026-04-19-v1-control-plane-release-交付说明.md
> 项目：RelayHub
> 阶段：delivery

## 1. 本轮交付

- 为 `control-plane` 补齐 release 运行骨架
- 为 `relayhub.jingshu.cc` 补齐 `/api/control-plane/*` 同源反代入口
- 前端保留 mock 默认入口，同时允许 release trial 显式切到真实 control-plane
- 已把 `relayhub.jingshu.cc` 收口为真实可写试用入口，而不再只是静态壳
- 已确认当前线上主路径为：
  - 模型库
  - 任务库
  - 运行记录
- 已完成最小业务闭环实测：
  - 新增模型
  - 测试连接
  - 绑定任务
  - 录入运行记录

## 2. 本轮保持不变

- 默认 `main.tsx` 继续不改
- `/providers` 外部模型源只读链继续保留
- 不上 Docker
- 不上数据库

## 3. 当前残留

- 文件持久化仍是最小方案，后续再评估数据库化
- 权限治理、外部程序自动回传和测评计划不在本轮
- `HEAD /api/control-plane/health` 仍未单独支持
- 当前 smoke 写入的数据为验证样本：
  - 模型：`Smoke 模型 2026-04-19`
  - 任务：`Smoke 任务 2026-04-19`
  - 运行记录：`custom-run-1`

## 4. release 最终现实

- RelayHub 不是通过 release 主 checkout 直接部署
- release 主 checkout 继续服务主业务，且保留原有脏工作区现实
- RelayHub 当前必须通过独立 `git worktree` 部署：
  - 仓库元目录：`/opt/aimandala-release/app/mindsync`
  - RelayHub worktree：`/opt/aimandala-release/worktrees/relayhub`
  - 运行分支：`relayhub/dev`
- `relayhub-control-plane` 当前运行方式：
  - `Node + systemd`
  - 监听 `127.0.0.1:4318`
  - 由 nginx 反代到 `/api/control-plane/*`
- 前端当前线上入口：
  - `https://relayhub.jingshu.cc/`
- 支持能力保持不变：
  - `https://relayhub.jingshu.cc/providers`
  - OpenAI-compatible 外部模型目录只读页

## 5. 当前阶段结论

- RelayHub 当前状态应定义为：
  - 已在 release 上以独立服务器测试分支 + 独立 worktree 方式跑通的最小治理控制台试用版
- 后续优先级应从“部署路径是否可行”切换到：
  - 产品可用性
  - 表单与交互细节
  - 预置模型质量
  - control-plane 数据语义深化
