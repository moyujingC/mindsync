import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseDraftSeedMarkdown, promoteDraftSeed } from '../src/jobs/promote-draft.mjs';

const draftSeedMarkdown = `# 从「AI 服务样例」看 AI 工作流诊断的真实需求

> schema：content-matrix/draft-seed/v1
> generated_at：2026-07-15T12:00:00.000Z
> source_insight_record_id：rec_1
> status：待人工扩写

## 发布账号候选

- 知行AI服务

## 开头草稿

很多人不是不想用 AI，而是不知道该从哪一条真实流程开始。

## 草稿结构

- 先描述一个具体卡点。
- 再解释为什么不能靠多装一个工具解决。

## 证据来源

来源账号发布了相关内容。

## CTA

拿一个小样本判断。

## 人工审核清单

- 已打开来源内容复核。
- 没有把单条内容写成市场结论。
`;

test('parseDraftSeedMarkdown extracts draft sections', () => {
  const draftSeed = parseDraftSeedMarkdown(draftSeedMarkdown);

  assert.equal(draftSeed.title, '从「AI 服务样例」看 AI 工作流诊断的真实需求');
  assert.equal(draftSeed.sourceInsightRecordId, 'rec_1');
  assert.match(draftSeed.opening, /不知道该从哪一条真实流程开始/);
  assert.deepEqual(draftSeed.outline, [
    '先描述一个具体卡点。',
    '再解释为什么不能靠多装一个工具解决。',
  ]);
});

test('promoteDraftSeed writes account draft without publishing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-promote-draft-'));
  const draftPath = join(dir, 'seed.md');
  const accountsRoot = join(dir, 'accounts');
  await writeFile(draftPath, draftSeedMarkdown, 'utf8');
  await mkdir(join(accountsRoot, '墨予镜'), { recursive: true });

  try {
    const result = await promoteDraftSeed({
      draftPath,
      accountsRoot,
      account: '墨予镜',
      date: '2026-07-15',
    });

    assert.equal(result.account, '墨予镜');
    assert.equal(result.sourceInsightRecordId, 'rec_1');
    assert.match(result.outputPath, /2026-07-15-/);
    assert.match(result.outputPath, /-草稿\.md$/);

    const output = await readFile(result.outputPath, 'utf8');
    assert.match(output, /^> 状态：草稿/m);
    assert.match(output, /## 待扩写正文/);
    assert.match(output, /待人工基于上方结构扩写/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('promoteDraftSeed refuses an unregistered account', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-promote-draft-'));
  const draftPath = join(dir, 'seed.md');
  await writeFile(draftPath, draftSeedMarkdown, 'utf8');

  try {
    await assert.rejects(
      promoteDraftSeed({
        draftPath,
        accountsRoot: join(dir, 'accounts'),
        account: '知行AI服务',
        date: '2026-07-21',
      }),
      /Unknown account: 知行AI服务/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
