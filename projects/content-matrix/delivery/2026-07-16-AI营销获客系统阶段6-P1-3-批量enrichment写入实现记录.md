> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-07-16
> source_of_truth：projects/content-matrix/tools/influencer-tracker/src/jobs/write-enrichment-insights.mjs
> 项目：内容矩阵
> 阶段：stage-6-p1-3

# AI营销获客系统阶段 6 P1-3 批量 enrichment 写入实现记录

本文记录 P1-3，也就是从目录中批量扫描 `enrichment.json`，并批量转成飞书 `洞察与选题` 候选。

## 1. 这一步解决什么问题

P1-2 只能处理单个 `enrichment.json`。

真实运营时，下载目录里会有多个账号、多个内容：

```text
downloads/
  <账号>/
    <内容ID>/
      enrichment.json
```

如果每个文件都单独执行一次写入，会有两个问题：

- 操作繁琐
- 每次都要读一遍飞书已有洞察，效率差

所以 P1-3 改成批量扫描后一次性写入。

## 2. 新增了什么

新增 CLI：

- `src/cli/write-enrichment-directory-insights.mjs`

增强 job：

- `writeEnrichmentDirectoryInsightsToFeishu`
- `findEnrichmentFiles`

新增样例目录：

- `fixtures/enrichments.example/`

新增脚本：

- `npm run insights:enrichments`

## 3. 当前命令怎么跑

本地 dry-run，不写飞书：

```bash
node src/cli/write-enrichment-directory-insights.mjs \
  --root-dir fixtures/enrichments.example
```

或：

```bash
npm run insights:enrichments
```

真实写飞书：

```bash
node src/cli/write-enrichment-directory-insights.mjs \
  --root-dir logs/downloads/bilibili \
  --feishu config/feishu.local.json
```

## 4. 当前逻辑

执行流程：

```text
rootDir
-> 递归扫描 enrichment.json
-> 逐个读取
-> 转成用户需求 / 选题候选
-> 汇总候选
-> 统一调用飞书写入层
-> 按 来源内容 + 洞察类型 去重
```

## 5. 输出结果

返回结果包括：

- `enrichmentCount`
- `inputCount`
- `createdCount`
- `duplicateCount`
- `recordIds`
- `enrichmentPaths`
- `candidates`

其中 `enrichmentPaths` 用来排查每条候选来自哪个本地 artifact。

## 6. 当前边界

这一步只做批量写入，不做状态回写。

还没做：

- 写入成功后回写每个 `enrichment.json`
- 生成批量写入报告文件
- 按日期 / 账号筛选
- 失败文件单独重试

## 7. 验证方式

测试覆盖：

1. 能递归扫描嵌套 artifact 目录。
2. 能从目录里批量读取 enrichment。
3. 能复用 lark-cli mock 完成批量去重写入。

同时验证了：

```bash
npm test
npm run insights:enrichments
```

## 8. 下一步

建议下一步做 P1-4：

```text
批量写入报告 + enrichment 状态回写
```

这样可以知道哪些 enrichment 已经进入飞书，哪些失败，哪些还待处理。
