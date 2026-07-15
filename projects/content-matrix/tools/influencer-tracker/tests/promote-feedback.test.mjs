import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFeedbackRecord, promoteFeedbackToAiServiceStudio } from '../src/jobs/promote-feedback.mjs';

const feedbackMarkdown = `# 样例成稿 发布反馈记录

> 状态：待补充
> 账号：墨予镜
> 对应成稿：/tmp/final.md
> 记录日期：2026-07-15

## 发布信息

- 发布平台：公众号
- 发布链接：https://example.com/post

## 服务信号

- 是否进入样本沟通：是
- 是否需要转入 ai-service-studio 记录：是
- 是否出现咨询意向：是
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
  assert.equal(result.needsAiServiceStudio, '是');
  assert.equal(result.sampleConversation, '是');
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
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
