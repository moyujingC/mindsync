# RelayHub v1 control-plane release QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-19
> source_of_truth：projects/relayhub/qa/2026-04-19-v1-control-plane-release-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 本地验证

- `projects/relayhub/control-plane` 的 `npm test` 通过
- `projects/relayhub/console` 的 `npm test` 通过
- `projects/relayhub/console` 的 `npm run build` 通过
- `RELAYHUB_CONTROL_PLANE_BASE_URL=/api/control-plane npm run build:trial` 通过

## 2. control-plane 验证

- `RELAYHUB_CONTROL_PLANE_DATA_DIR` 生效
- 数据文件不再要求落在仓库工作树内
- `GET /health` 正常
- `GET /api/control-plane/health` 正常
- `/models`、`/tasks`、`/runs`、`/overview` 不暴露 API Key 明文

## 3. release 验证

- `relayhub-control-plane` systemd 服务可启动、重启、开机自启
- `curl http://127.0.0.1:<port>/health` 返回 `200`
- `curl -k https://relayhub.jingshu.cc/api/control-plane/health` 返回 `200`
- `curl -k https://relayhub.jingshu.cc/api/control-plane/models` 返回模型条目 JSON

## 4. 前端试用验证

- `https://relayhub.jingshu.cc/` 首页摘要来自真实 overview
- 模型库不再只来自 mock
- 任务库可绑定已激活模型
- 运行记录可新增并刷新统计
- `/providers` 继续可打开
