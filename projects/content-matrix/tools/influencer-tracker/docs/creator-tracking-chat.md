# 飞书聊天博主追踪

## 目标交互

```text
你：追踪这个博主：https://...

Hermes：识别到抖音博主。请补充：关联主题、目标需求库和检查频率。

你：主题是企业 AI 落地，每天检查，写入企业 AI 研究库。

Hermes：展示确认卡片。

你：确认。

Hermes：已启用追踪；下一次每日 Worker 将开始检查。
```

## 工具合同

准备确认卡片，不写飞书：

```bash
npm run creator:tracking -- \
  --url 'https://www.douyin.com/user/...' \
  --topics '企业 AI 落地' \
  --frequency 每日
```

只有用户明确确认后才写入：

```bash
npm run creator:tracking -- --confirm 'creator-...'
```

待确认记录保存在本地 `logs/creator-tracking-pending.json`。该文件不是业务台账，只用于防止多轮聊天中误写飞书；确认成功后会删除对应记录。

## 当前接入状态

- 确认状态机和飞书写入工具已实现并有自动化测试。
- Hermes 服务已常驻 release 服务器，但飞书 Gateway（消息网关）尚未配置。因此当前不能直接在飞书聊天中调用；配置飞书消息事件和应用权限后，才可完成真实聊天验收。
