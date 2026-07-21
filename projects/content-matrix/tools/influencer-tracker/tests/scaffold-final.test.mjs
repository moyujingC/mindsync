import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseEditPackageMarkdown, scaffoldFinalDraft } from '../src/jobs/scaffold-final.mjs';

const editPackageMarkdown = `# 样例草稿 - 成稿编辑任务包

> 状态：待编辑
> 目标账号：墨予镜
> 草稿来源：/tmp/draft.md
> source_insight_record_id：research:research-final-1:1
> 编辑规则：projects/content-matrix/accounts/墨予镜/2026-07-09-墨予镜文章成稿编辑Skill-v1.md

## 任务目标

把下方账号草稿推进到“可进入成稿编辑”的状态。

## 原始草稿

# 样例草稿

## 开头草稿

很多人不知道从哪一条真实流程开始。
`;

test('parseEditPackageMarkdown extracts title and original draft', () => {
  const editPackage = parseEditPackageMarkdown(editPackageMarkdown);

  assert.equal(editPackage.title, '样例草稿');
  assert.equal(editPackage.draftSource, '/tmp/draft.md');
  assert.equal(editPackage.sourceInsightRecordId, 'research:research-final-1:1');
  assert.match(editPackage.originalDraft, /# 样例草稿/);
});

test('scaffoldFinalDraft writes a final draft skeleton', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'influencer-tracker-final-skeleton-'));
  const editPackagePath = join(dir, 'edit-package.md');
  const accountsRoot = join(dir, 'accounts');
  await writeFile(editPackagePath, editPackageMarkdown, 'utf8');

  try {
    const result = await scaffoldFinalDraft({
      editPackagePath,
      accountsRoot,
      account: '墨予镜',
      date: '2026-07-15',
    });

    assert.equal(result.account, '墨予镜');
    assert.equal(result.title, '样例草稿');
    assert.match(result.outputPath, /-成稿\.md$/);

    const output = await readFile(result.outputPath, 'utf8');
    assert.match(output, /^> 状态：待人工编辑/m);
    assert.match(output, /source_insight_record_id：research:research-final-1:1/);
    assert.match(output, /- \[ \] 结构审稿已完成/);
    assert.match(output, /## 成稿正文/);
    assert.match(output, /待人工基于下方原始草稿编辑/);
    assert.match(output, /## 原始草稿备份/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
