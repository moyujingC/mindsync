---
name: creator-tracking
description: Use when a user asks in Feishu chat to track, modify, pause, or resume a social-media creator.
---

# 博主追踪操作规范

## 触发

用户明确表达“追踪这个博主”并发送博主主页链接时，才进入本流程。内容链接、关键词结果或内容作者信息不能自动创建追踪账号。

## 两阶段操作

1. 调用 `creator:tracking` 准备请求，解析主页并生成确认 ID。
2. 向用户展示确认卡片；仅在用户明确回复“确认”后，使用确认 ID 调用 `creator:tracking --confirm`。

## 必须确认的信息

- 至少一个主题。
- 每个主题对应的需求库路由。
- 检查频率：每日、每周或手动。默认手动。
- 已存在同一平台账号时，询问是追加主题、修改频率、暂停还是保持不变。

## 禁止

- 不要仅因粘贴了主页就启用每日追踪。
- 不要把单条内容链接当作博主主页。
- 不要创建同一“平台 + 平台账号 ID”的重复记录。
- 不要在用户未确认前调用确认命令。
