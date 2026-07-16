> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-07-16
> source_of_truth：projects/content-matrix/tools/influencer-tracker/src/jobs/write-enrichment-insights.mjs
> 项目：内容矩阵
> 阶段：stage-6-p1-2

# AI营销获客系统阶段 6 P1-2 enrichment 转飞书洞察候选实现记录

本文记录 P1-2，也就是把本地 `enrichment.json` 转成飞书 `洞察与选题` 表里的候选记录。

## 1. 这一步解决什么问题

P1-1 已经能把本地素材转成：

```text
enrichment.json
```

里面包含：

- 需求信号
- 用户问题
- 洞察
- 选题候选

但这些结果还停留在本地文件里。要进入日常运营，需要能进入飞书多维表格，供人工审核、筛选和后续写 brief。

所以 P1-2 做的是：

```text
enrichment.json
-> 洞察候选
-> 飞书「洞察与选题」
```

## 2. 当前实现边界

这一步只做“候选写入”，不做“自动验证”。

也就是说：

- 可以写入飞书
- 默认状态仍然是 `待处理`
- 不会自动改成 `已验证`
- 不会直接进入销售判断

规则版 enrich 的结果必须人工复核。

## 3. 新增了什么

新增文件：

- `src/jobs/write-enrichment-insights.mjs`
- `src/cli/write-enrichment-insights.mjs`
- `tests/write-enrichment-insights.test.mjs`
- `fixtures/enrichment.example.json`

同时更新：

- `src/feishu/client.mjs`
- `package.json`

## 4. 当前命令怎么跑

只生成候选结果，不写飞书：

```bash
node src/cli/write-enrichment-insights.mjs \
  --enrichment fixtures/enrichment.example.json
```

或：

```bash
npm run insights:enrichment
```

真实写飞书：

```bash
node src/cli/write-enrichment-insights.mjs \
  --enrichment fixtures/enrichment.example.json \
  --feishu config/feishu.local.json
```

## 5. 转换规则

当前会从 `enrichment.json` 生成两类候选：

1. `用户需求`
2. `选题`

`用户需求` 来自 enrichment 的 `insights`。

`选题` 来自 enrichment 的 `topicCandidates`。

都会带上：

- 来源内容
- 来源评论
- 服务方向
- 适用账号
- 证据摘要
- 建议动作

## 6. 去重规则

这一步复用现有飞书写入层。

去重键仍然是：

```text
来源内容 + 洞察类型
```

这样同一条内容可以同时有：

- 一条 `用户需求`
- 一条 `选题`

但不会重复写入同类型候选。

## 7. 为什么改了 Feishu 映射

原来的候选写入只默认写 `选题`。

这一步需要支持从 enrichment 写入 `用户需求`，所以补了：

- `candidate.insightType`
- `candidate.targetAccounts`
- `candidate.source.commentUniqueKeys`

这样写入飞书时可以保留更多来源证据。

## 8. 当前验证方式

测试覆盖了：

1. 从 enrichment 生成 `用户需求` 和 `选题` 两类候选。
2. 不传飞书配置时，只返回候选，不写远端。
3. 传飞书配置时，能通过 lark-cli mock 完成去重写入。

## 9. 当前边界

还没做：

- 自动读取 artifact 目录里的最新 `enrichment.json`
- 批量写多个 artifact 的候选
- 写入后回写 `enrichment.json` 状态
- 人工审核后的状态同步

## 10. 下一步

下一步建议做：

```text
P1-3 批量 enrichment 写入
```

也就是从一个 downloads 目录里扫描多个 artifact，把已有 `enrichment.json` 批量转成飞书候选。
