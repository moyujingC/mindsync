import { readFile, writeFile } from 'node:fs/promises';

export async function promoteFeedbackToAiServiceStudio({
  feedbackPath,
  targetPath,
  serviceDirection = '待判断',
  status = '已回复',
  nextAction = '安排 20-30 分钟样本沟通',
}) {
  if (!feedbackPath) {
    throw new Error('Missing feedbackPath');
  }
  if (!targetPath) {
    throw new Error('Missing targetPath');
  }

  const feedback = parseFeedbackRecord(await readFile(feedbackPath, 'utf8'));
  if (feedback.needsAiServiceStudio !== '是') {
    throw new Error('Feedback record is not marked for ai-service-studio handoff');
  }

  const raw = await readFile(targetPath, 'utf8');
  const row = buildSampleConversationRow({
    feedback,
    serviceDirection,
    status,
    nextAction,
  });

  if (raw.includes(`| ${feedback.date} | ${feedback.objectName} |`)) {
    return {
      appended: false,
      reason: 'duplicate',
      row,
    };
  }

  const updated = appendTableRow(raw, row);
  await writeFile(targetPath, updated, 'utf8');

  return {
    appended: true,
    row,
  };
}

export function parseFeedbackRecord(raw) {
  const title = raw.match(/^#\s+(.+)\s+发布反馈记录$/m)?.[1]?.trim() ?? 'untitled';
  const account = raw.match(/^>\s*账号：(.+)$/m)?.[1]?.trim() ?? 'unknown';
  const date = raw.match(/^>\s*记录日期：(.+)$/m)?.[1]?.trim() ?? '';
  const platform = extractBulletValue(raw, '发布平台');
  const publishUrl = extractBulletValue(raw, '发布链接');
  const sampleConversation = extractBulletValue(raw, '是否进入样本沟通');
  const needsAiServiceStudio = extractBulletValue(raw, '是否需要转入 ai-service-studio 记录');
  const consultationIntent = extractBulletValue(raw, '是否出现咨询意向');

  return {
    title,
    account,
    date,
    platform,
    publishUrl,
    sampleConversation,
    needsAiServiceStudio,
    consultationIntent,
    objectName: `${account} / ${title}`,
  };
}

function buildSampleConversationRow({ feedback, serviceDirection, status, nextAction }) {
  const noteParts = [
    feedback.platform ? `平台：${feedback.platform}` : '',
    feedback.publishUrl ? `链接：${feedback.publishUrl}` : '',
    feedback.consultationIntent === '是' ? '已有咨询意向' : '',
    feedback.sampleConversation === '是' ? '内容反馈已进入样本沟通' : '内容反馈待进入样本沟通',
  ].filter(Boolean);

  return `| ${feedback.date} | ${feedback.objectName} | 内容反馈 | 待判断 | 内容咨询 | ${serviceDirection} | ${status} | ${nextAction} | ${noteParts.join('；')} |`;
}

function appendTableRow(raw, row) {
  const lines = raw.split('\n');
  const headerIndex = lines.findIndex((line) => line.startsWith('| 日期 |'));
  if (headerIndex === -1) {
    throw new Error('Could not find sample table header in ai-service-studio record');
  }
  const dividerIndex = headerIndex + 1;
  const insertIndex = dividerIndex + 1;
  lines.splice(insertIndex, 0, row);
  return `${lines.join('\n').replace(/\n?$/, '\n')}`;
}

function extractBulletValue(raw, label) {
  return raw.match(new RegExp(`^- ${escapeRegex(label)}：(.*)$`, 'm'))?.[1]?.trim() ?? '';
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
