import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareEditPackage } from '../src/jobs/prepare-edit.mjs';

test('prepareEditPackage creates an editing handoff package', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-edit-package-'));
  const draftPath = join(dir, 'draft.md');
  const outputDir = join(dir, 'edit-packages');

  await writeFile(draftPath, `# 样例草稿

> 状态：草稿
> 目标账号：墨予镜

## 开头草稿

很多人不知道从哪一条真实流程开始。

## 待扩写正文

待人工基于上方结构扩写。
`, 'utf8');

  try {
    const result = await prepareEditPackage({
      draftPath,
      outputDir,
      account: '墨予镜',
      date: '2026-07-15',
    });

    assert.equal(result.account, '墨予镜');
    assert.equal(result.title, '样例草稿');
    assert.match(result.outputPath, /成稿编辑任务包\.md$/);

    const output = await readFile(result.outputPath, 'utf8');
    assert.match(output, /## 任务目标/);
    assert.match(output, /## 编辑边界/);
    assert.match(output, /### 第 1 轮：结构审稿/);
    assert.match(output, /### 第 2 轮：表达降噪/);
    assert.match(output, /### 第 3 轮：待发检查/);
    assert.match(output, /## 原始草稿/);
    assert.match(output, /很多人不知道从哪一条真实流程开始/);
    assert.match(output, /墨予镜文章成稿编辑Skill-v1/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
