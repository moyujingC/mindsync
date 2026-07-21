import { readJsonFile } from '../utils/json-file.mjs';

const MINIMUM_CYCLES = 3;
const RECOMMENDED_CYCLES = 5;

export async function evaluateAgentLoopReadiness({ ledgerPath = 'logs/research-requests.json' }) {
  const ledger = await readJsonFile(ledgerPath, { requests: [] });
  const cycles = (ledger.requests ?? []).flatMap((request) => (request.candidates ?? []).flatMap((candidate, index) => {
    const feedback = candidate.publicationFeedback;
    if (candidate.status !== '已发布' || !isHttpUrl(feedback?.publishUrl)) {
      return [];
    }
    return [{
      requestId: request.requestId,
      candidateIndex: index + 1,
      serviceDirection: candidate.serviceDirection ?? request.serviceDirection ?? null,
      publishUrl: feedback.publishUrl,
      publishedAt: feedback.publishedAt ?? null,
      adjustment: feedback.researchAdjustment ?? null,
      hasResearchAdjustment: hasResearchAdjustment(feedback.researchAdjustment),
    }];
  }));
  const adjustedCycles = cycles.filter((cycle) => cycle.hasResearchAdjustment);
  const distinctRequests = new Set(adjustedCycles.map((cycle) => cycle.requestId)).size;
  const readiness = adjustedCycles.length >= MINIMUM_CYCLES && distinctRequests >= MINIMUM_CYCLES;

  return {
    ok: readiness,
    eligibleForEvaluation: readiness,
    minimumCycles: MINIMUM_CYCLES,
    recommendedCycles: RECOMMENDED_CYCLES,
    publishedCycleCount: cycles.length,
    adjustedCycleCount: adjustedCycles.length,
    distinctAdjustedRequestCount: distinctRequests,
    cycles,
    blockers: buildBlockers({ adjustedCycleCount: adjustedCycles.length, distinctRequests }),
    note: readiness
      ? 'Enough real publish-feedback-adjustment cycles exist to evaluate whether a weekly Agent Loop is useful. Human review must still decide whether to enable it.'
      : 'Do not enable an Agent Loop yet. Record real feedback and the explicit next-round research adjustment first.',
  };
}

function hasResearchAdjustment(adjustment) {
  return adjustment?.changed === '是'
    && ['关键词', '样本范围', 'CTA'].includes(adjustment?.type)
    && Boolean(adjustment?.note?.trim());
}

function buildBlockers({ adjustedCycleCount, distinctRequests }) {
  const blockers = [];
  if (adjustedCycleCount < MINIMUM_CYCLES) {
    blockers.push(`Need ${MINIMUM_CYCLES - adjustedCycleCount} more real publish-feedback-adjustment cycles.`);
  }
  if (distinctRequests < MINIMUM_CYCLES) {
    blockers.push(`Need ${MINIMUM_CYCLES - distinctRequests} more distinct research requests with a recorded adjustment.`);
  }
  return blockers;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
