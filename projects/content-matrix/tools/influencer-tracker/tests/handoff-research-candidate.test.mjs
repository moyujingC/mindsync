import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handoffResearchCandidate } from '../src/jobs/handoff-research-candidate.mjs';

test('handoffResearchCandidate rejects a candidate that has not entered the topic pool', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-handoff-reject-'));
  try {
    await writeLedger(dir, requestFixture({ candidateStatus: '待人工审核' }));
    await assert.rejects(
      () => handoffResearchCandidate({
        ledgerPath: join(dir, 'research-requests.json'),
        requestId: 'research-handoff-1',
        candidateIndex: 1,
        outputDir: join(dir, 'handoffs'),
      }),
      /must be 已转选题/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('handoffResearchCandidate generates a traceable brief and draft seed without publishing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-handoff-create-'));
  try {
    await writeLedger(dir, requestFixture({ candidateStatus: '已转选题' }));
    const result = await handoffResearchCandidate({
      ledgerPath: join(dir, 'research-requests.json'),
      requestId: 'research-handoff-1',
      candidateIndex: 1,
      outputDir: join(dir, 'handoffs'),
    });

    const brief = await readFile(result.briefPath, 'utf8');
    const draft = await readFile(result.draftSeedPath, 'utf8');
    assert.match(result.briefPath, /-brief\.md$/);
    assert.match(result.draftSeedPath, /-draft\.md$/);
    assert.match(brief, /source_insight_record_id：research:research-handoff-1:1/);
    assert.match(brief, /来源内容：xiaohongshu:note-1/);
    assert.match(brief, /人工决定：用于下一轮内容选题。/);
    assert.match(draft, /待人工扩写/);
    assert.match(result.nextAction, /不得自动发布/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('handoffResearchCandidate preserves yijing yishu non-diagnostic constraints', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-handoff-yijing-'));
  try {
    await writeLedger(dir, requestFixture({
      candidateStatus: '已转选题',
      templateId: 'yijing_yishu',
      targetAccount: '一镜一梳',
      constraints: ['仅整理公开表达，不记录或推断可识别个人信息。', '不输出心理诊断、疗效判断或替代专业服务的建议。'],
    }));
    const result = await handoffResearchCandidate({
      ledgerPath: join(dir, 'research-requests.json'),
      requestId: 'research-handoff-1',
      candidateIndex: 1,
      outputDir: join(dir, 'handoffs'),
    });

    const brief = await readFile(result.briefPath, 'utf8');
    assert.match(brief, /避免把内容观察写成心理诊断/);
    assert.match(brief, /不输出心理诊断、疗效判断/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('handoffResearchCandidate gives client projects an internal research pack instead of a public draft seed', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'research-handoff-client-'));
  try {
    await writeLedger(dir, requestFixture({
      candidateStatus: '已转选题',
      templateId: 'client_project',
      targetAccount: 'client-2026-retail-pilot',
      projectName: 'client-2026-retail-pilot',
      constraints: ['不上传客户非公开资料；仅使用获授权的公开内容和脱敏聚合结论。'],
    }));
    const result = await handoffResearchCandidate({
      ledgerPath: join(dir, 'research-requests.json'),
      requestId: 'research-handoff-1',
      candidateIndex: 1,
      outputDir: join(dir, 'handoffs'),
    });

    const researchPack = await readFile(result.researchPackPath, 'utf8');
    assert.equal(result.draftSeedPath, null);
    assert.match(result.researchPackPath, /-research-pack\.md$/);
    assert.match(researchPack, /项目代号：client-2026-retail-pilot/);
    assert.match(researchPack, /待确认问题/);
    assert.match(researchPack, /不自动生成公开内容草稿/);
    assert.match(result.nextAction, /不得自动生成公开草稿/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

async function writeLedger(dir, request) {
  await writeFile(join(dir, 'research-requests.json'), `${JSON.stringify({
    schema: 'content-matrix/research-request-ledger/v1',
    requests: [request],
  }, null, 2)}\n`, 'utf8');
}

function requestFixture({
  candidateStatus,
  templateId = 'enterprise_ai_service',
  targetAccount = '墨予镜',
  projectName = null,
  constraints = [],
}) {
  return {
    requestId: 'research-handoff-1',
    purpose: '评论挖需求',
    serviceDirection: '企业 AI 服务',
    targetAccount,
    orchestration: { templateId, projectName, constraints },
    candidates: [{
      status: candidateStatus,
      evidenceLevel: '观察',
      conclusionLevel: '假设',
      topicTitle: '从企业 AI 试点看真实需求',
      userProblem: '怎么判断先做哪个流程？',
      evidenceSummary: '评论区出现问题咨询。',
      decisionNote: '用于下一轮内容选题。',
      source: {
        contentUniqueKey: 'xiaohongshu:note-1',
        title: '企业 AI 试点',
        url: 'https://example.com/note-1',
        commentUniqueKeys: ['xiaohongshu:comment-1'],
      },
    }],
  };
}
