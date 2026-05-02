# RelayHub v1 Codex-first 原生 Responses 接入 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-26
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-26-v1-Codex-first-原生-Responses-接入-交付说明.md
> 项目：RelayHub
> 阶段：delivery

## 1. 本轮目标

记录 `RelayHub` 首次把 `Codex + Responses API` 收进正式 relay 主链路的实现与验证结果。

## 2. 交付范围

- `dev-relay` 新增 Codex `Responses` 路由
- `control-plane` 新增真实能力探测与绑定约束
- `console` 新增 Codex 兼容状态与任务阻断提示
- release 新增 `codex /v1` 路由与 `relayhub-dev-relay` 安装脚本

## 3. 验证记录

已完成：

- `projects/relayhub/dev-relay`
  - `npm test` 通过
- `projects/relayhub/control-plane`
  - `npm test` 通过
- `projects/relayhub/console`
  - `npm test` 通过
  - `npm run build` 通过

已验证实现点：

- `dev-relay` 已新增 `GET /v1/models` 与 `POST /v1/responses`
- `POST /v1/responses` 会强制覆盖请求内 `model` 为 `task-codex-repo` 当前绑定条目的 `modelId`
- Codex 入口未绑定、未激活、缺 API Key、未通过 `Responses` 流式探测时，会返回明确 `409`
- `control-plane` 已把 `POST /models/:id/test` 改为真实探测，并把结果写入 `capabilities`
- `task-codex-repo` 绑定不兼容入口时会被服务端 `409 incompatible_model_binding` 拒绝
- console 已显示 Codex 兼容状态，并在 `Codex Repo Coding` 行阻断不兼容入口绑定
- release 已补 `relayhub-dev-relay` service 安装脚本和 `/codex/v1/` nginx 安装脚本

尚未在本轮工作区直接执行：

- 本地手动 `curl` smoke
- 把真实 Codex `base_url` 临时切到本地 RelayHub 的请求
- release 节点安装后 `curl https://relayhub.jingshu.cc/codex/v1/*` smoke

## 4. 残留风险

- 当前自动化测试使用的是受控 mock upstream，不等同于你购买的 `code.ppchat.vip` 真实支持 `Responses + stream`
- 真实 release nginx 站点文件可能与样例存在局部差异，安装脚本仍需在目标机上执行并 `nginx -t`
- 本轮没有把运行记录自动写入 `runs`，因此线上真实链路问题仍主要依赖服务日志排查

## 5. 下一步建议

- 先在本地拉起 `control-plane` 与 `dev-relay`，按 runbook 执行三条 `curl /v1/*` smoke
- 再在 release 机安装 `relayhub-dev-relay` 与 `/codex/v1/` nginx 路由，执行 `curl https://relayhub.jingshu.cc/codex/v1/*`
- 最后再把外部 Codex 的 `base_url` 临时切到 `RelayHub`，确认不再直连 `code.ppchat.vip`
