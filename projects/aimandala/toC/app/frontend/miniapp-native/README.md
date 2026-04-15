# Miniapp Native Shell

这里是 `一镜一梳` 微信小程序原生工程壳。

它不承接 shared UI 本体，只负责：

1. `wx.login`
2. `session exchange`
3. `web-view` 装配 H5 miniapp runtime
4. `wx.requestPayment`
5. 生命周期恢复与最小本地存储

## 当前使用方式

1. 用微信开发者工具直接打开本目录
2. 复制 `project.private.config.example.json` 为本机 `project.private.config.json`，并替换成真实灰度 `appid`
3. 在开发者工具启动参数里传入：
   - `apiBaseUrl`
   - `runtimeBaseUrl`
   - 可选 `runtimePath`
4. 启动后会先走：
   - `wx.login`
   - `POST /api/v2/miniapp/session/exchange`
5. 然后把：
   - `channel=miniapp`
   - `miniappHost=native`
   - `userId`
   - `openId`
   带进 H5 runtime

示例启动 query：

```text
apiBaseUrl=https://web-api-gray.jingshu.cc&runtimeBaseUrl=https://web-gray.jingshu.cc&runtimePath=/
```

## 说明

- 浏览器调试壳仍保留在 `../miniapp/`
- 真机灰度链默认不允许本地假升级 fallback
- `project.config.json` 保持仓库安全占位值；灰度联调时应通过未提交的 `project.private.config.json` 覆盖真实 `appid`
- 真机联调前必须确认：
  - 开发者工具已勾选合法域名 / web-view 白名单
  - `apiBaseUrl` 指向灰度 backend
  - `runtimeBaseUrl` 指向灰度 H5 runtime
