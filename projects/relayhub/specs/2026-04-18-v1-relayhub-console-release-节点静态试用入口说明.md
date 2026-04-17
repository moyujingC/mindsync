# RelayHub Console：release 节点静态试用入口说明

> 状态：current
> 版本：v1
> owner：Engineer
> last_updated：2026-04-18

## 1. 目标

本轮目标是尽快在 `release 42.192.65.145` 上给 `RelayHub console` 提供一个可直接打开的静态试用入口，而不是继续停留在本地测试。

固定口径：

- 访问入口挂在现有域名子路径 `/relayhub`
- 默认主入口与 `main.tsx` 继续保持 mock
- 只新增一个显式 readonly real-fetch trial 构建入口
- 不新增后端常驻进程
- 不新增 auth env key
- 不引入真实认证治理、密钥治理或自动切换

## 2. 推荐部署形态

采用：

- 静态构建产物
- release 宿主机 `nginx` 子路径承接
- `/relayhub` 做 SPA fallback

不采用：

- `vite preview` 常驻
- 新 Node 服务
- 把 RelayHub console 混入现有业务 Docker 容器

## 3. 构建入口

保留两个入口：

- 默认入口：`index.html` -> `src/main.tsx`
  - 默认 mock
  - 本轮不改行为
- trial 入口：`trial.html` -> `src/trial-main.tsx`
  - 显式使用 `ConsoleBrowserDeploymentRuntimeInput.mode = "browser-fetch"`
  - 只在部署试用构建中使用

## 4. 子路径部署约定

trial 构建固定：

- `base = /relayhub/`
- router basename = `/relayhub`

因此部署后应满足：

- `/relayhub`
- `/relayhub/dashboard`
- `/relayhub/providers`
- `/relayhub/providers/:id`

刷新都不返回 404。

## 5. readonly real-fetch 口径

试用入口只验证 Providers readonly：

- collection path：`/providers`
- detail path：`/providers/:id`
- 允许 filters：`kind` / `environment` / `health` / `transparency`
- `RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON` 可进入请求
- detail `404 -> not-found`
- 非 `404` 非 `2xx` 继续向上抛

显式 browser fetch 试用构建仍要求：

- `RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch`
- `RELAYHUB_PROVIDERS_READONLY_BASE_URL=<readonly trial target>`

缺项时继续退回 mock。

## 6. release 节点落位

本轮采用最小旁路：

- 代码目录：`/opt/aimandala-release/app/mindsync`
- RelayHub 构建目录：`/opt/aimandala-release/app/mindsync/projects/relayhub/console/dist`
- 静态发布目录：`/var/www/web.jingshu.cc/relayhub`
- nginx 站点配置：宿主机正式站点下新增 `/relayhub` location

说明：

- 正式 TLS 与域名继续由 release 宿主机 `nginx + certbot` 承担
- RelayHub console 不新起容器
- 只占用宿主机静态目录与子路径配置

## 7. 推荐验证路径

部署后按以下口径验证：

1. 打开 `https://web.jingshu.cc/relayhub`
2. 刷新 `https://web.jingshu.cc/relayhub/providers`
3. 刷新 `https://web.jingshu.cc/relayhub/providers/deepseek-direct`
4. 确认页面静态资源不回到站点根路径
5. 若配置了 readonly real-fetch base URL，则验证 Providers list/detail/not-found

## 8. 非目标

本轮不做：

- 默认主入口切换到真实链路
- 真实 token 来源治理
- 新增 query 参数切换
- 新增页面内隐式开关
- 扩到 `dashboard / environments / eval` 的真实只读后端接入
