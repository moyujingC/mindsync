# RelayHub Console：release 节点静态试用入口实施任务

> 状态：current
> owner：Engineer
> last_updated：2026-04-18

## 1. 目标

在 `release 42.192.65.145` 上提供一个可打开的 `/relayhub` 静态试用入口，并保留显式 Providers readonly real-fetch trial 构建路径。

## 2. 实施范围

### 2.1 console 代码

- 保持 `src/main.tsx` 默认 mock 行为不变
- 新增 `src/trial-main.tsx`
- 新增 trial 构建脚本
- 补齐 Vite `base` 支持
- 补齐 Router basename 支持

### 2.2 部署目录

- 新增 `projects/relayhub/deploy/release-console/`
- 提供：
  - deploy 脚本
  - nginx 子路径配置样例
  - 目录约定与回滚说明

### 2.3 项目 artifact

- 补齐 spec
- 补齐 qa basis
- 补齐验证记录
- 补齐交付说明

## 3. 验收标准

- `npm test` 通过
- `npm run build` 通过
- `npm run build:trial` 通过
- `/relayhub` 子路径资源路径正确
- basename 下 `/providers` 与 `/providers/:id` 路由可刷新
- 默认入口仍是 mock
- trial 入口显式使用 browser-fetch readonly real-fetch 主链

## 4. 运维动作

1. 在 release 机拉取当前分支代码
2. 执行 `npm ci`
3. 执行 trial 构建
4. 同步 `dist/` 到静态目录
5. 安装或更新 nginx `/relayhub` 子路径配置
6. `nginx -t`
7. reload nginx
8. 进行页面访问验证

## 5. 风险与边界

- 若 readonly target 未配置或不可达，trial 入口会继续落回 mock
- 本轮不处理真实认证
- 本轮不把 RelayHub console 纳入 Docker 发布编排
