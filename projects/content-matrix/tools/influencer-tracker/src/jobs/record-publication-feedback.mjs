import { readFile, writeFile } from 'node:fs/promises';
import { ResearchRequestStore } from '../storage/research-request-store.mjs';
import { renderResearchBrief, syncResearchRequestToFeishu } from './research-request.mjs';

export async function recordPublicationFeedback({ feedbackPath, ledgerPath, feishuClient = null, feishuConfig = null }) {
  if (!feedbackPath) {
    throw new Error('Missing feedbackPath');
  }
  if (!ledgerPath) {
    throw new Error('Missing ledgerPath');
  }
  const feedback = parsePublicationFeedback(await readFile(feedbackPath, 'utf8'));
  const reference = parseResearchCandidateReference(feedback.sourceInsightRecordId);
  if (!reference) {
    throw new Error('Feedback record must contain a research candidate reference like research:<request-id>:<candidate-index>');
  }
  if (!feedback.publishUrl || !isHttpUrl(feedback.publishUrl)) {
    throw new Error('A valid 发布链接 is required before a research candidate can be marked 已发布');
  }

  const store = new ResearchRequestStore({ filePath: ledgerPath });
  await store.load();
  const updated = store.update(reference.requestId, (request) => {
    const candidate = request.candidates?.[reference.candidateIndex - 1];
    if (!candidate) {
      throw new Error(`Research candidate not found: ${reference.candidateIndex}`);
    }
    if (candidate.status !== '已转选题' && candidate.status !== '已发布') {
      throw new Error(`Research candidate must be 已转选题 before publication feedback; current status: ${candidate.status}`);
    }
    const publishedAt = feedback.publishedAt || new Date().toISOString();
    candidate.status = '已发布';
    candidate.publicationFeedback = {
      recordedAt: new Date().toISOString(),
      feedbackPath,
      platform: feedback.platform || null,
      publishUrl: feedback.publishUrl,
      publishedAt,
      metrics: feedback.metrics,
      serviceSignals: feedback.serviceSignals,
      representativeFeedback: feedback.representativeFeedback,
      objections: feedback.objections || null,
      nextAction: feedback.nextAction || null,
    };
    return {
      ...request,
      status: deriveRequestStatus(request.candidates),
      updatedAt: new Date().toISOString(),
      decisions: [...(request.decisions ?? []), {
        candidateIndex: reference.candidateIndex,
        action: '已发布',
        decisionNote: `已记录发布反馈：${feedback.publishUrl}`,
        decidedAt: new Date().toISOString(),
      }],
    };
  });
  await store.save();
  if (updated.outputPath) {
    await writeFile(updated.outputPath, renderResearchBrief(updated), 'utf8');
  }
  const syncedRequest = await syncResearchRequestToFeishu({
    request: updated,
    feishuClient,
    feishuConfig,
  });
  return { requestId: reference.requestId, candidateIndex: reference.candidateIndex, feedback, request: syncedRequest };
}

export function parsePublicationFeedback(raw) {
  const bullet = (label) => extractBulletValue(raw, label);
  return {
    title: raw.match(/^#\s+(.+)\s+发布反馈记录$/m)?.[1]?.trim() ?? 'untitled',
    sourceInsightRecordId: raw.match(/^>\s*研究候选：(.+)$/m)?.[1]?.trim() ?? '',
    platform: bullet('发布平台'),
    publishUrl: bullet('发布链接'),
    publishedAt: bullet('发布时间'),
    metrics: {
      views: bullet('阅读/播放'),
      likes: bullet('点赞'),
      favorites: bullet('收藏'),
      comments: bullet('评论'),
      shares: bullet('转发'),
      directMessages: bullet('私信'),
      otherEngagement: bullet('其他有效互动'),
    },
    serviceSignals: {
      realProblem: bullet('是否出现真实问题'),
      sampleWillingness: bullet('是否出现资料样本意愿'),
      consultationIntent: bullet('是否出现咨询意向'),
      sampleConversation: bullet('是否进入样本沟通'),
      needsAiServiceStudio: bullet('是否需要转入 ai-service-studio 记录'),
    },
    representativeFeedback: [bullet('评论/私信 1'), bullet('评论/私信 2')].filter(Boolean),
    objections: bullet('反对意见或疑虑'),
    nextAction: extractFirstCheckedAction(raw),
  };
}

function parseResearchCandidateReference(value) {
  const match = String(value ?? '').match(/^research:(.+):(\d+)$/);
  if (!match) return null;
  return { requestId: match[1], candidateIndex: Number(match[2]) };
}

function deriveRequestStatus(candidates) {
  if (candidates.every((candidate) => candidate.status === '已发布')) return '已发布';
  if (candidates.some((candidate) => candidate.status === '已转选题' || candidate.status === '已发布')) return '已转选题';
  return '待人工确认';
}

function extractBulletValue(raw, label) {
  return raw.match(new RegExp(`^- ${escapeRegex(label)}：(.*)$`, 'm'))?.[1]?.trim() ?? '';
}

function extractFirstCheckedAction(raw) {
  return raw.match(/^- \[[xX]\]\s+(.+)$/m)?.[1]?.trim() ?? '';
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
