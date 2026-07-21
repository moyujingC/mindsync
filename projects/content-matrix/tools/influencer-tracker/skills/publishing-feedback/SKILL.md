---
name: publishing-feedback
description: 在真实发布后记录互动、服务信号、反对意见和下一步，并把结果回写到来源研究候选。用于内容发布后的人工复盘。
---

# 发布反馈规范

## 前提

- 内容必须已由人工发布；本 Skill 不调用发布、私信、评论或报价接口。
- 成稿应带有 `source_insight_record_id`，格式为 `research:<请求ID>:<候选编号>`。
- 只有来源候选已“转选题”且反馈填入有效 HTTP(S) 发布链接时，才可回写“已发布”。

## 记录内容

- 发布事实：平台、链接、时间、内容形态。
- 基础互动：阅读/播放、点赞、收藏、评论、转发、私信和其他有效互动。
- 服务信号：真实问题、资料样本意愿、咨询意向、样本沟通和是否转入 AI 服务工作区。
- 定性反馈：代表性评论/私信、拒绝与反对意见、人工下一步动作。

先运行 `feedback:record` 成功回写，反馈状态变为“已回写”后，才能转入 AI 服务样本沟通记录。转入时只带研究候选 ID、发布链接、服务信号和最多 120 字的反对意见摘要；不复制评论或私信全文。

点赞或评论量不是成交证据；“已发布”只表示存在真实发布链接。

## 执行路径

```bash
# 创建人工填写的反馈模板
npm run prepare:feedback -- --final-draft ../../accounts/墨予镜/2026-07-21-某篇成稿.md --account 墨予镜

# 人工填写后，回写本地研究台账和可选飞书请求摘要
npm run feedback:record -- --feedback ../../accounts/墨予镜/feedback/2026-07-21-某篇成稿-发布反馈.md --feishu config/feishu.local.json

# 只有明确标记需要转入时，才人工转入样本沟通记录
npm run promote:feedback -- --feedback ../../accounts/墨予镜/feedback/2026-07-21-某篇成稿-发布反馈.md --service-direction 'AI 工作流诊断'
```

## 数据边界

- 发布和公开互动摘要归内容系统。
- 样本沟通、报价、交付和客户反馈归 `projects/ai-service-studio/`。
- 只在获得同意且无法反向识别个人时，将客户沟通聚合为内容洞察。
