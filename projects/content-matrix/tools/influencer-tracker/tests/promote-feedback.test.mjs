import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFeedbackRecord, promoteFeedbackToAiServiceStudio } from '../src/jobs/promote-feedback.mjs';

const feedbackMarkdown = `# 样例成稿 发布反馈记录

> 状态：已回写
> 账号：墨予镜
> 对应成稿：/tmp/final.md
> 研究候选：research:research-feedback-1:1
> 记录日期：2026-07-15

## 发布信息

- 发布平台：公众号
- 发布链接：https://example.com/post

## 服务信号

- 是否进入样本沟通：是
- 是否需要转入 ai-service-studio 记录：是
- 是否出现咨询意向：是
- 是否出现真实问题：是
- 是否出现资料样本意愿：是
- 反对意见或疑虑：担心客户资料权限与试点范围。
`;

const recordMarkdown = `# 样本沟通记录

## 样本池

| 日期 | 对象 | 对象类型 | 客户阶段 | 信任来源 | 服务方向 | 状态 | 下一步 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  | 待发送 |  |  |
`;

test('parseFeedbackRecord extracts key values', () => {
  const result = parseFeedbackRecord(feedbackMarkdown);
  assert.equal(result.account, '墨予镜');
  assert.equal(result.status, '已回写');
  assert.equal(result.needsAiServiceStudio, '是');
  assert.equal(result.sampleConversation, '是');
  assert.equal(result.sourceInsightRecordId, 'research:research-feedback-1:1');
  assert.equal(result.objections, '担心客户资料权限与试点范围。');
});

test('promoteFeedbackToAiServiceStudio requires a recorded feedback result and real publication link', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-promote-feedback-gate-'));
  const feedbackPath = join(dir, 'feedback.md');
  const targetPath = join(dir, '样本沟通记录.md');
  await writeFile(targetPath, recordMarkdown, 'utf8');

  try {
    await writeFile(feedbackPath, feedbackMarkdown.replace('状态：已回写', '状态：待补充'), 'utf8');
    await assert.rejects(
      () => promoteFeedbackToAiServiceStudio({ feedbackPath, targetPath }),
      /must be successfully written back/,
    );
    await writeFile(feedbackPath, feedbackMarkdown.replace('https://example.com/post', ''), 'utf8');
    await assert.rejects(
      () => promoteFeedbackToAiServiceStudio({ feedbackPath, targetPath }),
      /requires a valid 发布链接/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('promoteFeedbackToAiServiceStudio appends row to sample conversation record', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-promote-feedback-'));
  const feedbackPath = join(dir, 'feedback.md');
  const targetPath = join(dir, '样本沟通记录.md');
  await writeFile(feedbackPath, feedbackMarkdown, 'utf8');
  await writeFile(targetPath, recordMarkdown, 'utf8');

  try {
    const result = await promoteFeedbackToAiServiceStudio({
      feedbackPath,
      targetPath,
      serviceDirection: 'AI 工作流诊断',
    });

    assert.equal(result.appended, true);
    const output = await readFile(targetPath, 'utf8');
    assert.match(output, /\| 2026-07-15 \| 墨予镜 \/ 样例成稿 \| 内容反馈 \|/);
    assert.match(output, /AI 工作流诊断/);
    assert.match(output, /研究候选：research:research-feedback-1:1/);
    assert.match(output, /出现真实问题/);
    assert.match(output, /愿意提供资料样本/);
    assert.match(output, /反对意见：担心客户资料权限与试点范围。/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('promoteFeedbackToAiServiceStudio retains affirmative signals with an operator note', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-promote-feedback-note-'));
  const feedbackPath = join(dir, 'feedback.md');
  const targetPath = join(dir, '样本沟通记录.md');
  await writeFile(feedbackPath, feedbackMarkdown.replace('是否进入样本沟通：是', '是否进入样本沟通：是（模拟）'), 'utf8');
  await writeFile(targetPath, recordMarkdown, 'utf8');

  try {
    await promoteFeedbackToAiServiceStudio({ feedbackPath, targetPath });
    const output = await readFile(targetPath, 'utf8');
    assert.match(output, /内容反馈已进入样本沟通/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('promoteFeedbackToAiServiceStudio deduplicates by research candidate instead of record date', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-promote-feedback-dedupe-'));
  const feedbackPath = join(dir, 'feedback.md');
  const targetPath = join(dir, '样本沟通记录.md');
  await writeFile(feedbackPath, feedbackMarkdown, 'utf8');
  await writeFile(targetPath, recordMarkdown, 'utf8');

  try {
    const first = await promoteFeedbackToAiServiceStudio({ feedbackPath, targetPath });
    const second = await promoteFeedbackToAiServiceStudio({ feedbackPath, targetPath });

    assert.equal(first.appended, true);
    assert.equal(second.appended, false);
    assert.equal(second.reason, 'duplicate');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('promoteFeedbackToAiServiceStudio falls back to date and object dedupe for legacy feedback records', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-promote-feedback-legacy-'));
  const feedbackPath = join(dir, 'feedback.md');
  const targetPath = join(dir, '样本沟通记录.md');
  const legacyFeedback = feedbackMarkdown.replace(/^> 研究候选：.*\n/m, '');
  await writeFile(feedbackPath, legacyFeedback, 'utf8');
  await writeFile(targetPath, recordMarkdown, 'utf8');

  try {
    const first = await promoteFeedbackToAiServiceStudio({ feedbackPath, targetPath });
    const second = await promoteFeedbackToAiServiceStudio({ feedbackPath, targetPath });

    assert.equal(first.appended, true);
    assert.equal(second.appended, false);
    assert.equal(second.reason, 'duplicate');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
