# App

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/toC/app/README.md


这里放 `一镜一梳` To C 主产品的应用入口层。

当前显式拆分为：

- `backend/`
  - 后端 API、流程编排和服务入口
- `frontend/`
  - To C 用户端前端入口

这样做是为了避免旧仓库里的 `app/api + app/core + app/ui` 再次混成单一入口。

其中 `frontend/` 不只代表“一个 Web 前端”，而是承接 To C 用户端的多渠道入口。

当前与未来默认按下面方式理解：

- 当前主线
  - 移动端 Web 版
- 后续可能新增
  - 小程序版
  - 原生 App 版

同时，旧架构已经明确考虑过“多渠道共用一部分前端业务逻辑”的方向。

因此后续前端结构不应只是简单按渠道平铺，而应优先采用：

- `frontend/shared/`
  - 共享业务逻辑、API service、类型定义
- `frontend/mobile-web/`
  - Web 端 UI 与平台适配
- `frontend/miniapp/`
  - 小程序端 UI 与平台适配
- `frontend/native-app/`
  - 原生 App 端 UI 与平台适配

这样可以避免：

- 业务逻辑在多个渠道重复实现
- UI 层和流程层重新混在一起
