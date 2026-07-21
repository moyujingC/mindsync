import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { recordPublicationFeedback } from '../src/jobs/record-publication-feedback.mjs';
import { prepareEditPackage } from '../src/jobs/prepare-edit.mjs';
import { prepareFeedbackRecord } from '../src/jobs/prepare-feedback.mjs';
import { scaffoldFinalDraft } from '../src/jobs/scaffold-final.mjs';
import { runResearchRequest } from '../src/jobs/research-request.mjs';

test('publication feedback marks an approved research candidate published and preserves human signals', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'publication-feedback-'));
  try {
    const ledgerPath = join(dir, 'research-requests.json');
    const briefDir = join(dir, 'briefs');
    const request = await createApprovedRequest({ ledgerPath, briefDir });
    const feedbackPath = join(dir, 'feedback.md');
    await writeFile(feedbackPath, feedbackMarkdown({ requestId: request.requestId }), 'utf8');

    const result = await recordPublicationFeedback({ feedbackPath, ledgerPath });

    assert.equal(result.request.status, '已发布');
    assert.equal(result.request.candidates[0].status, '已发布');
    assert.equal(result.request.candidates[0].publicationFeedback.publishUrl, 'https://example.com/published-post');
    assert.equal(result.request.candidates[0].publicationFeedback.serviceSignals.consultationIntent, '是');
    assert.equal(result.request.candidates[0].publicationFeedback.researchAdjustment.changed, '是');
    assert.equal(result.request.candidates[0].publicationFeedback.researchAdjustment.type, '关键词');
    const brief = await readFile(request.outputPath, 'utf8');
    assert.match(brief, /当前状态：已发布/);
    assert.match(brief, /选题状态：已发布/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('publication feedback refuses to mark a candidate published without a real link', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'publication-feedback-link-'));
  try {
    const ledgerPath = join(dir, 'research-requests.json');
    const request = await createApprovedRequest({ ledgerPath, briefDir: join(dir, 'briefs') });
    const feedbackPath = join(dir, 'feedback.md');
    await writeFile(feedbackPath, feedbackMarkdown({ requestId: request.requestId, publishUrl: '' }), 'utf8');

    await assert.rejects(
      () => recordPublicationFeedback({ feedbackPath, ledgerPath }),
      /valid 发布链接 is required/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('publication feedback syncs the updated request summary to Feishu when configured', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'publication-feedback-feishu-'));
  try {
    const ledgerPath = join(dir, 'research-requests.json');
    const request = await createApprovedRequest({ ledgerPath, briefDir: join(dir, 'briefs') });
    const feedbackPath = join(dir, 'feedback.md');
    await writeFile(feedbackPath, feedbackMarkdown({ requestId: request.requestId }), 'utf8');
    const writes = [];
    const result = await recordPublicationFeedback({
      feedbackPath,
      ledgerPath,
      feishuConfig: { tables: { researchRequests: { fields: researchRequestFields() } } },
      feishuClient: {
        async listRecords() { return []; },
        async createRecords(tableName, records) {
          writes.push({ tableName, records });
          return ['rec-published-request'];
        },
      },
    });

    assert.equal(result.request.feishu.action, 'created');
    assert.equal(writes[0].tableName, 'researchRequests');
    assert.equal(writes[0].records[0]['状态'], '已发布');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('research candidate reference survives draft, edit, final, and feedback preparation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'publication-feedback-provenance-'));
  try {
    const accountsRoot = join(dir, 'accounts');
    const draftPath = join(dir, 'draft.md');
    await writeFile(draftPath, `# 可追溯草稿

> 状态：草稿
> source_insight_record_id：research:research-provenance-1:1

## 待扩写正文

待人工编辑。
`, 'utf8');
    const edit = await prepareEditPackage({
      draftPath,
      account: '墨予镜',
      outputDir: join(dir, 'edit-packages'),
      date: '2026-07-21',
    });
    const final = await scaffoldFinalDraft({
      editPackagePath: edit.outputPath,
      account: '墨予镜',
      accountsRoot,
      date: '2026-07-21',
    });
    const feedback = await prepareFeedbackRecord({
      finalDraftPath: final.outputPath,
      account: '墨予镜',
      accountsRoot,
      date: '2026-07-21',
    });

    const output = await readFile(feedback.outputPath, 'utf8');
    assert.match(output, /研究候选：research:research-provenance-1:1/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

async function createApprovedRequest({ ledgerPath, briefDir }) {
  const request = await runResearchRequest({
    request: {
      requestId: 'research-publication-feedback-1',
      purpose: '选题调研',
      serviceDirection: '企业 AI 服务',
      collect: { mode: 'manual', platform: 'xiaohongshu', includeComments: false },
    },
    collect: async () => ({
      request: { mode: 'manual', platform: 'xiaohongshu', includeComments: false, limit: 1 },
      audit: { requestCount: 0, cacheUrls: [] },
      contents: { fetchedCount: 1, items: [{ uniqueKey: 'xiaohongshu:published-case', platform: 'xiaohongshu', title: '企业 AI 试点案例', description: '从一个流程开始', url: 'https://example.com/source' }] },
      comments: { fetchedCount: 0, items: [] },
    }),
    ledgerPath,
    outputDir: briefDir,
  });
  request.candidates[0].status = '已转选题';
  request.status = '已转选题';
  const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
  ledger.requests[0] = request;
  await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
  return request;
}

function feedbackMarkdown({ requestId, publishUrl = 'https://example.com/published-post' }) {
  return `# 企业 AI 试点内容 发布反馈记录

> 账号：墨予镜
> 研究候选：research:${requestId}:1
> 记录日期：2026-07-21

## 发布信息

- 发布平台：公众号
- 发布链接：${publishUrl}
- 发布时间：2026-07-21T10:00:00+08:00

## 基础反馈

- 阅读/播放：100
- 点赞：10
- 收藏：3
- 评论：2
- 转发：1
- 私信：1
- 其他有效互动：1

## 服务信号

- 是否出现真实问题：是
- 是否出现资料样本意愿：否
- 是否出现咨询意向：是
- 是否进入样本沟通：是
- 是否需要转入 ai-service-studio 记录：是

## 代表性反馈

- 评论/私信 1：能否先看一个真实流程？
- 评论/私信 2：想了解知识库试点范围。
- 反对意见或疑虑：担心资料权限。

## 下一步动作

- [x] 安排样本沟通并确认资料权限边界

## 下一轮研究调整

- 是否改变下一轮研究：是
- 调整类型：关键词
- 调整说明：下一轮优先研究流程诊断与资料权限问题。
`;
}

function researchRequestFields() {
  return {
    requestId: '请求ID', purpose: '研究目的', serviceDirection: '服务方向', targetAccount: '目标账号',
    collectMode: '采集方式', platform: '平台', sampleLimit: '样本上限', contentCount: '内容样本数',
    commentCount: '评论样本数', requestCount: 'TikHub调用数', status: '状态', nextAction: '下一步',
    briefPath: '研究简报路径', createdAt: '创建时间', updatedAt: '更新时间',
  };
}
