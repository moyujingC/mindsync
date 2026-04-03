# Frontend

这里放 `一镜一梳` To C 主产品的用户端前端入口。

当前已知事实：

- 当前主入口是手机端 Web 版
- 后续预计还会有小程序版
- 如果用户规模继续增长，未来可能再做原生 App 版

首批迁移时优先承接：

- 旧仓库 `app/ui` 中真正仍在使用的移动端 Web 入口
- 运行依赖说明
- 必要的构建与验证脚本

当前不放：

- To B / Studio 前端
- 纯设计稿导出的无效壳项目
- 与 `V3` 实验线强绑定的前端逻辑

建议后续按渠道逐步收束，例如：

```text
frontend/
  shared/
    core/
    api/
    types/
  mobile-web/
  miniapp/
  native-app/
```

其中各层默认职责如下：

- `shared/core/`
  - 多渠道共享的前端业务逻辑、状态机和纯函数流程
- `shared/api/`
  - 多渠道共享的 API service、请求封装和错误翻译
- `shared/types/`
  - 多渠道共享的类型定义和 DTO 镜像
- `mobile-web/`
  - 手机端 Web 版实现
- `miniapp/`
  - 小程序端实现
- `native-app/`
  - 原生 App 端实现

默认原则是：

- 共享“业务决策和流程语义”
- 不强行共享“页面组件和平台能力”

当前阶段不必提前把空目录都建出来，但目录设计与文档命名应默认兼容这种扩展方式。
