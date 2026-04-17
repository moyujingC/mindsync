# RelayHub Console：release 节点静态试用入口交付说明

> 状态：current
> owner：Engineer
> last_updated：2026-04-18

## 1. 本轮交付目标

交付一个可在 release 节点现有域名子路径 `/relayhub` 打开的静态试用入口，并保留显式 Providers readonly real-fetch trial 路径。

## 2. 本轮交付内容

- console 子路径部署支持
- trial 独立构建入口
- release 静态部署目录与 nginx 子路径配置样例
- 本轮 spec/task/qa/delivery artifact
- release 节点 `/relayhub` 静态入口已实装

## 3. 未纳入本轮

- 默认入口切换到真实链路
- 真实认证治理
- 新后端服务
- Docker 化 RelayHub console 发布编排

## 4. 已上线试用入口

- URL：`https://web.jingshu.cc/relayhub/`
- Providers：`https://web.jingshu.cc/relayhub/providers`
- Provider detail 示例：`https://web.jingshu.cc/relayhub/providers/deepseek-direct`

当前部署产物为 trial 构建入口，但由于尚未配置真实 readonly target，Providers 数据仍按既有 mock fallback 展示。后续接真实 readonly target 时，只需在执行 `npm run build:trial` 前显式传入：

```bash
RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch
RELAYHUB_PROVIDERS_READONLY_BASE_URL=<readonly-target>
```

## 5. 后续 handoff

下一步进入最小 readonly real-fetch 接入联调：确定 readonly target 地址与 CORS / 同源代理策略后，重新执行 trial 构建并同步静态目录。
