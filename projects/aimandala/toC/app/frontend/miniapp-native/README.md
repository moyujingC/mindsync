# Miniapp Native Shell

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/toC/app/frontend/miniapp-native/README.md


这里是 `一镜一梳` 微信小程序原生工程壳。

它不承接 shared UI 本体，只负责：

1. `web-view` 装配 H5 miniapp runtime
2. 本地预览会话写入与恢复
3. 生命周期恢复与最小本地存储

## 当前使用方式

1. 用微信开发者工具直接打开本目录
2. 复制 `project.private.config.example.json` 为本机 `project.private.config.json`，并替换成真实灰度 `appid`
3. 在开发者工具启动参数里传入：
   - `runtimeBaseUrl`
   - 可选 `runtimePath`
   - 可选 `userId`
   - 可选 `openId`
4. 启动后把：
   - `channel=miniapp`
   - `miniappHost=native`
   - `userId`
   - `openId`
     带进 H5 runtime

示例启动 query：

```text
runtimeBaseUrl=https://web-gray.jingshu.cc&runtimePath=/
```

## 说明

- 浏览器调试壳仍保留在 `../miniapp/`
- 当前 native 壳不接入登录和历史接口，只负责把 H5 runtime 拉起
- `project.config.json` 保持仓库安全占位值；灰度联调时应通过未提交的 `project.private.config.json` 覆盖真实 `appid`
- 真机联调前必须确认：
  - 开发者工具已勾选合法域名 / web-view 白名单
  - `runtimeBaseUrl` 指向灰度 H5 runtime
