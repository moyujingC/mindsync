import { readJsonFile } from '../utils/json-file.mjs';
import { validateFeishuConfig } from '../feishu/config.mjs';

export async function checkResearchReadiness({
  apiKey = process.env.TIKHUB_API_KEY,
  feishuConfig = null,
  ledgerPath = 'logs/research-requests.json',
  probe = null,
  tikhubClient = null,
}) {
  const blockers = [];
  const warnings = [];
  const checks = {
    tikhubKey: Boolean(apiKey?.trim()),
    feishuConfig: null,
    ledger: null,
    probe: null,
  };

  if (!checks.tikhubKey) {
    blockers.push('Missing TIKHUB_API_KEY. Set it in the environment before real TikHub collection.');
  }

  if (feishuConfig) {
    const validation = validateFeishuConfig(feishuConfig);
    checks.feishuConfig = validation;
    if (!validation.ok) {
      blockers.push(...validation.errors.map((error) => `Invalid Feishu config: ${error}`));
    }
  } else {
    warnings.push('No Feishu config supplied. A successful collection will not write to the daily collaboration ledger.');
  }

  const ledger = await readJsonFile(ledgerPath, { requests: [] });
  const requests = ledger.requests ?? [];
  const publishedCandidates = requests.flatMap((request) => request.candidates ?? [])
    .filter((candidate) => candidate.status === '已发布' && candidate.publicationFeedback?.publishUrl);
  const verifiedCandidates = requests.flatMap((request) => request.candidates ?? [])
    .filter((candidate) => candidate.conclusionLevel === '已验证');
  checks.ledger = {
    requestCount: requests.length,
    publishedCandidateCount: publishedCandidates.length,
    verifiedCandidateCount: verifiedCandidates.length,
  };
  if (publishedCandidates.length === 0) {
    warnings.push('No real publication feedback is recorded yet. Do not enable Agent Loop before 3-5 real research -> publish -> feedback cycles.');
  }

  if (probe) {
    validateProbe(probe);
    if (!checks.tikhubKey) {
      checks.probe = { attempted: false, reason: 'missing-api-key' };
    } else {
      try {
        const response = await tikhubClient.getContentDetail({
          platform: probe.platform,
          shareUrl: probe.shareUrl,
        });
        checks.probe = {
          attempted: true,
          ok: true,
          platform: probe.platform,
          cacheUrl: response.cacheUrl ?? null,
          requestCount: response.audit?.requestCount ?? null,
        };
      } catch (error) {
        checks.probe = { attempted: true, ok: false, error: error.message };
        blockers.push(`TikHub probe failed: ${error.message}`);
      }
    }
  }

  return {
    ok: blockers.length === 0,
    safeToRunWriteMode: blockers.length === 0 && Boolean(feishuConfig),
    blockers,
    warnings,
    checks,
  };
}

function validateProbe(probe) {
  if (!probe.platform || !probe.shareUrl) {
    throw new Error('TikHub probe requires platform and shareUrl');
  }
}
