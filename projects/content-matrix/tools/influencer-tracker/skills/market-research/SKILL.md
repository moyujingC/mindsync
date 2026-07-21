---
name: market-research
description: 用小样本、可追溯证据和人工确认执行内容市场调研。用于链接、关键词、对标账号和手工内容的研究请求。
---

# 市场调研规范

## 研究原则

- 每次研究请求只服务一个明确目的：收藏整理、评论挖需求、选题调研或账号拆解。
- 默认采样 5-10 条，先验证样本质量和成本，再扩大范围。
- 记录平台、模式、样本数、评论数、TikHub 调用数和缓存地址。
- 结论必须能回到内容、评论、转写稿或人工沟通证据；没有证据时写“待人工补充”。

## 证据与结论等级

- `线索`：有内容样本，但尚不足以支持稳定判断。
- `观察`：至少两条相关评论，或多条可追溯内容显示相同现象。
- `假设`：自动生成或基于公开样本的洞察，默认状态。
- `已验证`：仅在人工补充外部反馈、样本沟通或可复查证据后使用。

评论、互动量和模型输出都不能自动把结论标为“已验证”。

## 执行路径

```text
研究目的和对象
-> 选择 TikHub / 手工内容 / 本地提纯稿
-> 限制样本与评论范围
-> 生成研究简报和台账
-> 人工审核候选
-> 转选题、结束或补充验证证据
```

## 当前命令

```bash
# 真实数据源可用后使用 TikHub；先 dry-run 控制成本
npm run research:run -- --template enterprise_ai_service --mode search --platform xiaohongshu --keyword '企业 AI 工作流' --dry-run

# TikHub 不可用时使用公开手工样本
npm run research:manual -- --input fixtures/manual-research.example.json --dry-run

# 人工将候选转入选题，或补充验证依据
npm run research:confirm -- --request-id 'research-...' --candidate 1 --action 转选题 --decision-note '进入下一轮选题。'
```

## 不做

- 不把采集成功、报告数量或单条评论当作市场验证。
- 不在没有真实反馈时启动每周 Agent Loop（代理循环）。
- 不自动联络样本、报价或承诺服务结果。
