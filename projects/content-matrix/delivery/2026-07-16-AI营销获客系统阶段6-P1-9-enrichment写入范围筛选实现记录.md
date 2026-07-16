> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-07-16
> source_of_truth：projects/content-matrix/tools/influencer-tracker/src/jobs/write-enrichment-insights.mjs
> 项目：内容矩阵
> 阶段：stage-6-p1-9

# AI营销获客系统阶段 6 P1-9 enrichment 写入范围筛选实现记录

本文记录 P1-9，也就是给 enrichment 批量写入增加日期和账号范围筛选。

## 1. 这一步解决什么问题

P1-3 之后，批量写入会递归扫描 `rootDir` 下所有 `enrichment.json`。

这对样例验证没问题，但真实运营中容易误扫历史 artifact。例如今天只想处理某个账号的新内容，却把过去所有 enrichment 都扫描一遍。

所以这一步新增范围筛选。

## 2. 当前实现

新增导出函数：

```text
filterEnrichmentPaths(enrichmentPaths, { date, creator })
```

批量写入支持：

```bash
--date 2026-07-16
--creator B站样例账号
```

筛选逻辑是路径级匹配：

- `date` 匹配 `enrichment.json` 路径中的日期片段。
- `creator` 匹配 `enrichment.json` 路径中的账号片段。

这样不要求现有 artifact 立刻重构目录，只要路径里包含日期或账号即可筛选。

## 3. CLI 用法

```bash
node src/cli/write-enrichment-directory-insights.mjs \
  --root-dir logs/downloads/bilibili \
  --date 2026-07-16 \
  --creator B站样例账号 \
  --report logs/enrichment-writes/2026-07-16-B站样例账号.json \
  --markdown-report logs/enrichment-writes/2026-07-16-B站样例账号.md
```

报告会记录：

```json
{
  "filters": {
    "date": "2026-07-16",
    "creator": "B站样例账号"
  }
}
```

## 4. 验证方式

新增测试覆盖：

- `filterEnrichmentPaths` 能同时按日期和账号筛选。
- 批量写入只处理匹配的 `enrichment.json`。
- JSON 报告会记录本次 `filters`。

已验证：

```bash
npm test
```

结果：

```text
tests 79
pass 79
fail 0
```

## 5. 当前边界

筛选是路径级匹配，不读取每个 enrichment 内部字段做筛选。

这个选择更快，也适合当前 artifact 目录结构。后续如果要做更严格的筛选，可以基于 `metadata.json` 或 `enrichment.source` 做二次过滤。
