import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runOpsDaily } from '../src/jobs/ops-daily.mjs';

test('runOpsDaily wires report, topic batch, daily summary and failure review together', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-ops-daily-'));
  const creatorsPath = join(dir, 'creators.json');
  const storePath = join(dir, 'store.json');
  const reportDir = join(dir, 'runs');
  const topicDir = join(dir, 'topic-candidates');
  const accountsRoot = join(dir, 'accounts');
  const dailySummaryOutput = join(dir, 'daily-summaries', '2026-07-15.md');
  const failureReviewOutput = join(dir, 'failure-reviews', '2026-07-15.md');
  const originalFetch = globalThis.fetch;

  await mkdir(join(accountsRoot, '墨予镜'), { recursive: true });
  await writeFile(creatorsPath, JSON.stringify([{
    id: 'enabled',
    name: '启用账号',
    platform: 'bilibili',
    externalId: '2',
    enabledStatus: '启用',
  }]), 'utf8');

  globalThis.fetch = async () => new Response(`
    <rss><channel>
      <item>
        <title>内容团队如何用 AI 拆选题和草稿</title>
        <link>https://www.bilibili.com/video/BV5555555555</link>
        <guid>https://www.bilibili.com/video/BV5555555555</guid>
        <pubDate>Wed, 15 Jul 2026 01:00:00 GMT</pubDate>
        <description>简介</description>
      </item>
    </channel></rss>
  `, { status: 200 });

  try {
    const result = await runOpsDaily({
      dryRun: true,
      creatorsPath,
      storePath,
      reportDir,
      topicDir,
      accountsRoot,
      dailySummaryOutput,
      failureReviewOutput,
      cwd: dir,
    });

    assert.equal(result.reportSummary.createdCount, 1);
    const dailySummary = await readFile(dailySummaryOutput, 'utf8');
    const failureReview = await readFile(failureReviewOutput, 'utf8');
    const batchFiles = await readFile(result.topicReportPath, 'utf8');

    assert.match(dailySummary, /新增内容数：1/);
    assert.match(failureReview, /待人工处理账号数：0/);
    assert.match(batchFiles, /content-matrix\/topic-candidates-batch\/v1/);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(dir, { recursive: true, force: true });
  }
});
