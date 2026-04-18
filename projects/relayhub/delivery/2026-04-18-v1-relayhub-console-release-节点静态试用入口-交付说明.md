# RelayHub Console：release 节点静态试用入口交付说明

> 状态：current
> owner：Engineer
> last_updated：2026-04-18

## 1. 本轮交付目标

交付一个可在 release 节点独立子域 `relayhub.jingshu.cc` 打开的静态试用入口，并保留现有 `/relayhub` 子路径兼容入口与显式 Providers readonly real-fetch trial 路径。

## 2. 本轮交付内容

- console 子路径部署支持
- trial 独立构建入口
- release 静态部署目录与 nginx 子路径配置样例
- 本轮 spec/task/qa/delivery artifact
- release 节点 `/relayhub` 静态入口已实装
- release 节点 `relayhub.jingshu.cc` 独立子域入口作为推荐入口推进

## 3. 未纳入本轮

- 默认入口切换到真实链路
- 真实认证治理
- 新后端服务
- Docker 化 RelayHub console 发布编排

## 4. 已上线试用入口

- 推荐 URL：`https://relayhub.jingshu.cc/`
- 推荐 Providers：`https://relayhub.jingshu.cc/providers`
- 推荐 Provider detail 示例：`https://relayhub.jingshu.cc/providers/deepseek-direct`
- 兼容 URL：`https://web.jingshu.cc/relayhub/`
- 兼容 Providers：`https://web.jingshu.cc/relayhub/providers`
- 兼容 Provider detail 示例：`https://web.jingshu.cc/relayhub/providers/deepseek-direct`

当前部署产物为 trial 构建入口，但由于尚未配置真实 readonly target，Providers 数据仍按既有 mock fallback 展示。后续接真实 readonly target 时，推荐先安装 `/api` 同源反代，再执行 trial 构建：

```bash
RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch
RELAYHUB_PROVIDERS_READONLY_BASE_URL=/api
RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT=openai-models
```

子域当前已在 release nginx、静态目录与 HTTPS 侧全部就绪：

- `https://relayhub.jingshu.cc/`
- `https://relayhub.jingshu.cc/providers`
- `https://relayhub.jingshu.cc/providers/deepseek-direct`

当前 release 已完成真实只读试点接入：

- `https://relayhub.jingshu.cc/api/models` 返回真实模型目录
- `https://relayhub.jingshu.cc/providers` 显示 model-derived provider 列表
- `https://relayhub.jingshu.cc/providers/gpt-5` 显示 model-derived provider 详情

## 5. 后续 handoff

下一步进入“真实后端契约对齐后的最小接入验证”延伸阶段：

- 若后续提供真正 `/providers` 目录后端，可继续保留 `openai-models` 作为试用模式
- 若要引入真实治理元数据，再进入 provider 聚合与指标落位
