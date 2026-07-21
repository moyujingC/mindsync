import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  buildDraftSeedFromBrief,
  renderContentBriefMarkdown,
  renderDraftSeedMarkdown,
} from '../analysis/content-brief.mjs';
import { ResearchRequestStore } from '../storage/research-request-store.mjs';

export async function handoffResearchCandidate({
  ledgerPath = 'logs/research-requests.json',
  requestId,
  candidateIndex,
  outputDir = 'logs/research-handoffs',
}) {
  if (!requestId) {
    throw new Error('Missing requestId');
  }
  if (!Number.isInteger(candidateIndex) || candidateIndex < 1) {
    throw new Error('candidateIndex must be a positive integer');
  }

  const store = new ResearchRequestStore({ filePath: ledgerPath });
  await store.load();
  const request = store.get(requestId);
  if (!request) {
    throw new Error(`Research request not found: ${requestId}`);
  }
  const candidate = request.candidates?.[candidateIndex - 1];
  if (!candidate) {
    throw new Error(`Research candidate not found: ${candidateIndex}`);
  }
  if (candidate.status !== '已转选题') {
    throw new Error(`Research candidate must be 已转选题 before handoff; current status: ${candidate.status}`);
  }

  const brief = buildBriefFromResearchCandidate({ request, candidate, candidateIndex });
  const draftSeed = buildDraftSeedFromBrief(brief);
  const baseName = `${sanitizeFilename(request.requestId)}-candidate-${candidateIndex}`;
  const resolvedOutputDir = resolve(outputDir);
  const briefPath = join(resolvedOutputDir, `${baseName}-brief.md`);
  const draftSeedPath = join(resolvedOutputDir, `${baseName}-draft.md`);

  await mkdir(dirname(briefPath), { recursive: true });
  await writeFile(briefPath, `${renderContentBriefMarkdown(brief)}\n`, 'utf8');
  await writeFile(draftSeedPath, `${renderDraftSeedMarkdown(draftSeed)}\n`, 'utf8');

  return {
    requestId,
    candidateIndex,
    title: candidate.topicTitle,
    briefPath,
    draftSeedPath,
    nextAction: '人工审阅交接包后，显式运行 promote:draft 选择账号写入草稿；不得自动发布。',
  };
}

export function buildBriefFromResearchCandidate({ request, candidate, candidateIndex }) {
  const targetAccount = candidate.targetAccount ?? request.targetAccount;
  return {
    schema: 'content-matrix/content-brief/v1',
    generatedAt: new Date().toISOString(),
    sourceInsightRecordId: `research:${request.requestId}:${candidateIndex}`,
    title: candidate.topicTitle,
    targetAccounts: targetAccount ? [targetAccount] : [],
    targetAudience: targetAudienceFor(request),
    userProblem: candidate.userProblem,
    evidenceSummary: renderEvidenceSummary({ request, candidate }),
    contentAngle: buildContentAngle(candidate),
    suggestedStructure: suggestedStructureFor(request),
    cta: ctaFor(request),
    handoffNotes: [
      '来源内容和评论证据需在进入成稿前人工复核。',
      '候选仍是待验证假设，不把单次采样写成市场结论。',
      '此交接包不会自动发布、私信、报价或成交。',
      ...(request.orchestration?.constraints ?? []),
    ],
  };
}

function renderEvidenceSummary({ request, candidate }) {
  return [
    `研究请求：${request.requestId}`,
    `候选编号：${candidateIndexLabel(candidate)}`,
    `证据等级：${candidate.evidenceLevel}`,
    `结论等级：${candidate.conclusionLevel}`,
    `来源内容：${candidate.source.contentUniqueKey} / ${candidate.source.title}`,
    candidate.source.url ? `来源链接：${candidate.source.url}` : '',
    candidate.source.commentUniqueKeys?.length ? `来源评论：${candidate.source.commentUniqueKeys.join(', ')}` : '',
    `证据摘要：${candidate.evidenceSummary}`,
    candidate.decisionNote ? `人工决定：${candidate.decisionNote}` : '',
  ].filter(Boolean).join('\n');
}

function candidateIndexLabel(candidate) {
  return candidate.source.contentUniqueKey ?? '待补充';
}

function targetAudienceFor(request) {
  if (request.orchestration?.templateId === 'yijing_yishu') {
    return '关注疗愈、整理、日常秩序和自我照顾的读者。';
  }
  if (request.orchestration?.templateId === 'moyujing') {
    return '关注 AI、个体生产力、内容表达和一人公司实践的读者。';
  }
  if (request.orchestration?.templateId === 'client_project') {
    return '由客户项目负责人根据目标客户补充。';
  }
  return '有真实业务流程、资料整理或内容生产压力的小团队 / 个人专业服务者。';
}

function buildContentAngle(candidate) {
  return `围绕「${candidate.topicTitle}」写一篇有证据边界的问题拆解型内容：说明用户卡点，并给出可人工复核的下一步。`;
}

function suggestedStructureFor(request) {
  const shared = [
    '用一个来源内容中的具体场景开头，避免替样本补充未出现的事实。',
    '说明用户问题和已有证据，区分观察与假设。',
    '给出一个小检查、观察角度或可执行动作。',
    '说明需要人工确认的边界，不做确定性承诺。',
  ];
  if (request.orchestration?.templateId === 'yijing_yishu') {
    return [...shared, '避免把内容观察写成心理诊断、疗效判断或个体建议。'];
  }
  return shared;
}

function ctaFor(request) {
  if (request.orchestration?.templateId === 'enterprise_ai_service') {
    return '如果你也有一条真实流程，可以拿一个小样本，先判断是否适合做 AI 小实验。';
  }
  return '欢迎结合自己的场景补充观察；涉及具体行动前请先做人工判断。';
}

function sanitizeFilename(value) {
  return String(value ?? 'research')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
