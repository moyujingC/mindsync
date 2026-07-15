import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { buildContentBriefFromInsight, renderContentBriefMarkdown } from '../analysis/content-brief.mjs';
import { FeishuBitableClient, mapFeishuInsightRecord } from '../feishu/client.mjs';
import { LarkCliBitableClient } from '../feishu/lark-cli-client.mjs';
import { validateFeishuConfig } from '../feishu/config.mjs';
import { readJsonFile } from '../utils/json-file.mjs';

export async function buildBriefsFromFeishu({ feishuPath, outputDir, all = false }) {
  const feishuConfig = await readJsonFile(feishuPath);
  const configValidation = validateFeishuConfig(feishuConfig);
  if (!configValidation.ok) {
    throw new Error(`Invalid Feishu config: ${configValidation.errors.join('; ')}`);
  }

  const client = feishuConfig.mode === 'lark-cli'
    ? new LarkCliBitableClient(feishuConfig)
    : new FeishuBitableClient(feishuConfig);
  const fieldMap = feishuConfig.tables.insights.fields;
  const records = await client.listRecords('insights');
  const insights = records.map((record) => mapFeishuInsightRecord(record, fieldMap));
  const selected = insights.filter((insight) => all || insight.status === '已转选题');

  const outputs = [];
  for (const insight of selected) {
    const brief = buildContentBriefFromInsight(insight);
    const filePath = join(outputDir, `${sanitizeFilename(insight.title)}-${insight.recordId}.md`);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${renderContentBriefMarkdown(brief)}\n`, 'utf8');
    outputs.push({
      recordId: insight.recordId,
      title: insight.title,
      status: insight.status,
      filePath,
    });
  }

  return {
    selectedCount: selected.length,
    createdCount: outputs.length,
    outputs,
  };
}

function sanitizeFilename(value) {
  return (value ?? 'untitled')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}
