import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFinalDraftMarkdown, prepareFeedbackRecord } from '../src/jobs/prepare-feedback.mjs';

const finalDraftMarkdown = `# 样例成稿

> 状态：待发布
> source_insight_record_id：research:research-1:1

## 成稿正文

这是一篇样例成稿。
`;

test('parseFinalDraftMarkdown extracts title', () => {
  const result = parseFinalDraftMarkdown(finalDraftMarkdown);
  assert.equal(result.title, '样例成稿');
  assert.equal(result.status, '待发布');
  assert.equal(result.sourceInsightRecordId, 'research:research-1:1');
});

test('prepareFeedbackRecord rejects a final draft that is still being edited', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-feedback-status-'));
  const finalDraftPath = join(dir, 'final.md');
  const accountsRoot = join(dir, 'accounts');
  await writeFile(finalDraftPath, finalDraftMarkdown.replace('状态：待发布', '状态：待人工编辑'), 'utf8');
  await mkdir(join(accountsRoot, '墨予镜'), { recursive: true });

  try {
    await assert.rejects(
      () => prepareFeedbackRecord({ finalDraftPath, accountsRoot, account: '墨予镜' }),
      /must be marked 待发布 or 已发布/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('prepareFeedbackRecord writes feedback template', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-feedback-'));
  const finalDraftPath = join(dir, 'final.md');
  const accountsRoot = join(dir, 'accounts');
  await writeFile(finalDraftPath, finalDraftMarkdown, 'utf8');
  await mkdir(join(accountsRoot, '墨予镜'), { recursive: true });

  try {
    const result = await prepareFeedbackRecord({
      finalDraftPath,
      accountsRoot,
      account: '墨予镜',
      date: '2026-07-15',
    });

    const output = await readFile(result.outputPath, 'utf8');
    assert.match(output, /^# 样例成稿 发布反馈记录/m);
    assert.match(output, /## 发布信息/);
    assert.match(output, /是否进入样本沟通：否/);
    assert.match(output, /是否需要转入 ai-service-studio 记录：否/);
    assert.match(output, /研究候选：research:research-1:1/);
    assert.match(output, /样本沟通记录\.md/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
