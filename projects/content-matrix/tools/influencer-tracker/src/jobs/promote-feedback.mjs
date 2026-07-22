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
  if (feedback.status !== '已回写') {
    throw new Error('Feedback record must be successfully written back before ai-service-studio handoff');
  }
  if (!isHttpUrl(feedback.publishUrl)) {
    throw new Error('Feedback record requires a valid 发布链接 before ai-service-studio handoff');
  }

  const raw = await readFile(targetPath, 'utf8');
  const row = buildSampleConversationRow({
    feedback,
    serviceDirection,
    status,
    nextAction,
  });

  const duplicateMarker = feedback.sourceInsightRecordId
    ? `研究候选：${feedback.sourceInsightRecordId}`
    : `| ${feedback.date} | ${feedback.objectName} |`;
  if (raw.includes(duplicateMarker)) {
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
  const status = raw.match(/^>\s*状态：(.+)$/m)?.[1]?.trim() ?? '';
  const account = raw.match(/^>\s*账号：(.+)$/m)?.[1]?.trim() ?? 'unknown';
  const date = raw.match(/^>\s*记录日期：(.+)$/m)?.[1]?.trim() ?? '';
  const sourceInsightRecordId = raw.match(/^>\s*研究候选：(.+)$/m)?.[1]?.trim() ?? '';
  const platform = extractBulletValue(raw, '发布平台');
  const publishUrl = extractBulletValue(raw, '发布链接');
  const sampleConversation = extractBulletValue(raw, '是否进入样本沟通');
  const needsAiServiceStudio = extractBulletValue(raw, '是否需要转入 ai-service-studio 记录');
  const consultationIntent = extractBulletValue(raw, '是否出现咨询意向');
  const realProblem = extractBulletValue(raw, '是否出现真实问题');
  const sampleWillingness = extractBulletValue(raw, '是否出现资料样本意愿');
  const objections = extractBulletValue(raw, '反对意见或疑虑');

  return {
    title,
    status,
    account,
    date,
    platform,
    publishUrl,
    sampleConversation,
    needsAiServiceStudio,
    consultationIntent,
    realProblem,
    sampleWillingness,
    objections,
    sourceInsightRecordId,
    objectName: `${account} / ${title}`,
  };
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildSampleConversationRow({ feedback, serviceDirection, status, nextAction }) {
  const noteParts = [
    feedback.platform ? `平台：${feedback.platform}` : '',
    feedback.publishUrl ? `链接：${feedback.publishUrl}` : '',
    feedback.sourceInsightRecordId ? `研究候选：${feedback.sourceInsightRecordId}` : '',
    isYes(feedback.consultationIntent) ? '已有咨询意向' : '',
    isYes(feedback.realProblem) ? '出现真实问题' : '',
    isYes(feedback.sampleWillingness) ? '愿意提供资料样本' : '',
    isYes(feedback.sampleConversation) ? '内容反馈已进入样本沟通' : '内容反馈待进入样本沟通',
    feedback.objections ? `反对意见：${truncateText(feedback.objections, 120)}` : '',
  ].filter(Boolean);

  return `| ${feedback.date} | ${feedback.objectName} | 内容反馈 | 待判断 | 内容咨询 | ${serviceDirection} | ${status} | ${nextAction} | ${noteParts.join('；')} |`;
}

function isYes(value) {
  return String(value ?? '').trim().startsWith('是');
}

function truncateText(value, maxLength) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
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
