# 墨予镜公众号内容生产 Agent 工作流

> 状态：working
> 版本：0.1.0
> owner：CEO / Content Lead
> last_updated：2026-08-23
> source_of_truth：projects/content-matrix/agent-workflow/README.md
> 项目：内容矩阵 / 墨予镜
> 关联 SPEC：[关卡制试点 SPEC](../specs/2026-08-23-墨予镜公众号内容生产智能体-关卡制试点SPEC.md)

这里维护“墨予镜公众号内容生产”这条工作流中的 Agent 岗位、交接合同、运行记录和后续 Skill 提炼依据。

当前只有第一个岗位：内容访谈与草稿助手。后续 Agent 必须在前一岗位和人工生产动作已经跑通后再增加。

## 当前工作流假设

```text
主题卡 / 已确认公开证据
  -> 内容访谈与草稿助手（对话确认观点与结构）
  -> 草稿
  -> 人工质量门
  -> 不通过：回到同一 Agent 深聊并修订草稿
  -> 排版助手
  -> 人工发布
  -> 发布回流表
```

其中人工确认不是等待环节，而是第一人称表达的必要质量门。

## 当前 Agent 索引

| 岗位 | 当前状态 | 本地定义 | 运行时身份 |
| --- | --- | --- | --- |
| [内容访谈与草稿助手](moyujing-content-interviewer/README.md) | 隔离配置完成，待模型与飞书机器人 | `agent-workflow/moyujing-content-interviewer/` | 展示名：`myjContentAgent`；Hermes Profile：`myjcontentagent` |

## 后续 Skill 提炼规则

本目录的 Agent 定义暂不是通用 Skill。至少完成 3 次真实或脱敏演练，并保留输入、输出、人工修改点、失败情形和复盘结论后，才评估是否提炼为 Skill。

Skill 只沉淀反复稳定的“操作方法”，不沉淀个人密钥、飞书应用信息、客户资料、未确认的个人观点或一次性服务器路径。
