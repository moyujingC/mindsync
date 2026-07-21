import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { requireExistingAccountDirectory } from '../utils/account-directory.mjs';

export async function prepareFeedbackRecord({
  finalDraftPath,
  account,
  accountsRoot,
  outputDir,
  date = new Date().toISOString().slice(0, 10),
  overwrite = false,
}) {
  if (!finalDraftPath) {
    throw new Error('Missing finalDraftPath');
  }
  if (!account) {
    throw new Error('Missing account');
  }

  const raw = await readFile(finalDraftPath, 'utf8');
  const finalDraft = parseFinalDraftMarkdown(raw);
  const accountDir = await requireExistingAccountDirectory({ accountsRoot, account });
  const outputPath = join(
    outputDir ?? join(accountDir, 'feedback'),
    `${date}-${sanitizeFilename(finalDraft.title)}-发布反馈.md`,
  );

  if (!overwrite && await exists(outputPath)) {
    throw new Error(`Feedback record already exists: ${outputPath}. Use --overwrite to replace it.`);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderFeedbackTemplate({
    account,
    title: finalDraft.title,
    finalDraftPath,
    sourceInsightRecordId: finalDraft.sourceInsightRecordId,
    date,
  }), 'utf8');

  return {
    account,
    title: finalDraft.title,
    outputPath,
  };
}

export function parseFinalDraftMarkdown(raw) {
  const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? 'untitled';
  const sourceInsightRecordId = raw.match(/^>\s*source_insight_record_id：(.+)$/m)?.[1]?.trim() ?? null;
  return { title, sourceInsightRecordId };
}

function renderFeedbackTemplate({ account, title, finalDraftPath, sourceInsightRecordId, date }) {
  return [
    `# ${title} 发布反馈记录`,
    '',
    `> 状态：待补充`,
    `> 账号：${account}`,
    `> 对应成稿：${finalDraftPath}`,
    `> 研究候选：${sourceInsightRecordId ?? '待人工补充'}`,
    `> 记录日期：${date}`,
    '',
    '## 发布信息',
    '',
    '- 发布平台：',
    '- 发布链接：',
    '- 发布时间：',
    '- 内容形态：公众号 / 小红书 / 视频 / 其他',
    '',
    '## 基础反馈',
    '',
    '- 阅读/播放：',
    '- 点赞：',
    '- 收藏：',
    '- 评论：',
    '- 转发：',
    '- 私信：',
    '- 其他有效互动：',
    '',
    '## 服务信号',
    '',
    '- 是否出现真实问题：是 / 否',
    '- 是否出现资料样本意愿：否',
    '- 是否出现咨询意向：否',
    '- 是否进入样本沟通：否',
    '- 是否需要转入 ai-service-studio 记录：否',
    '',
    '## 代表性反馈',
    '',
    '- 评论/私信 1：',
    '- 评论/私信 2：',
    '- 反对意见或疑虑：',
    '',
    '## 下一步动作',
    '',
    '- [ ] 如已真实发布，运行 `feedback:record` 回写研究候选状态',
    '- [ ] 如有服务信号，转入 `projects/ai-service-studio/records/样本沟通记录.md`',
    '- [ ] 更新后续选题或服务表达',
    '',
    '## 下一轮研究调整',
    '',
    '- 是否改变下一轮研究：否',
    '- 调整类型：关键词 / 样本范围 / CTA / 不调整',
    '- 调整说明：',
    '',
    '## 备注',
    '',
    '- ',
    '',
  ].join('\n');
}

async function exists(filePath) {
  try {
    await readFile(filePath, 'utf8');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function sanitizeFilename(value) {
  return (value ?? 'untitled')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/[「」]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 80);
}
