import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const DEFAULT_SKILL_PATH = 'projects/content-matrix/accounts/墨予镜/2026-07-09-墨予镜文章成稿编辑Skill-v1.md';

export async function prepareEditPackage({
  draftPath,
  account,
  outputDir,
  skillPath = DEFAULT_SKILL_PATH,
  date = new Date().toISOString().slice(0, 10),
}) {
  if (!draftPath) {
    throw new Error('Missing draftPath');
  }
  if (!account) {
    throw new Error('Missing account');
  }

  const draft = await readFile(draftPath, 'utf8');
  const title = extractTitle(draft);
  const outputPath = join(outputDir, `${date}-${sanitizeFilename(title)}-成稿编辑任务包.md`);
  const content = renderEditPackage({
    title,
    account,
    draftPath,
    skillPath,
    draft,
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, 'utf8');

  return {
    account,
    title,
    outputPath: resolve(outputPath),
  };
}

function renderEditPackage({ title, account, draftPath, skillPath, draft }) {
  return [
    `# ${title} - 成稿编辑任务包`,
    '',
    `> 状态：待编辑`,
    `> 目标账号：${account}`,
    `> 草稿来源：${draftPath}`,
    `> 编辑规则：${skillPath}`,
    '',
    '## 任务目标',
    '',
    '把下方账号草稿推进到“可进入成稿编辑”的状态。本任务包不要求一次生成最终成稿，优先完成结构审稿、表达降噪和待发检查。',
    '',
    '## 编辑边界',
    '',
    '- 不自动发布。',
    '- 不自动生成配图或排版。',
    '- 不把单条样例内容写成市场结论。',
    '- 不承诺确定增长、确定成交或无人监管自动化。',
    '- 需要人工打开来源内容复核后，才能进入最终成稿。',
    '',
    '## 最小执行版',
    '',
    '### 第 1 轮：结构审稿',
    '',
    '```text',
    '不要润色。',
    '只从公众号成品编辑的角度看这篇文章，帮我做结构审稿：',
    '',
    '- 开头哪里进入太慢',
    '- 哪几段重复了',
    '- 哪几段应该提前',
    '- 哪几段应该删掉',
    '- 哪个位置最适合提前抛出核心观点',
    '',
    '输出格式：',
    '1. 建议保留的主线',
    '2. 建议删除的段落',
    '3. 建议调整顺序的段落',
    '4. 一个更适合公众号的结构顺序',
    '```',
    '',
    '### 第 2 轮：表达降噪',
    '',
    '```text',
    '不要补内容，不要拔高，不要扩写。',
    '只做表达降噪。',
    '',
    '请帮我找出这篇里：',
    '- 最像 AI 写法的句子',
    '- 最像给同行看的句子',
    '- 最空、最抽象、最不接地的句子',
    '- 可以删掉但不影响主线的句子',
    '',
    '然后把它们改成更像人在说话、更短、更具体、更适合公众号读者往下读。',
    '```',
    '',
    '### 第 3 轮：待发检查',
    '',
    '```text',
    '把这篇文章当公众号待发稿，做最后一轮成品检查。',
    '',
    '只回答：',
    '- 标题是否合适',
    '- 开头前 3 段是否能留住读者',
    '- 哪个小标题最像报告，不像文章',
    '- 哪 3 句最该再压短',
    '- 哪一段读起来最像同行文章',
    '- 结尾是否自然',
    '',
    '不要整篇重写，只给最小修改建议。',
    '```',
    '',
    '## 原始草稿',
    '',
    draft.trim(),
    '',
  ].join('\n');
}

function extractTitle(markdown) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? 'untitled';
}

function sanitizeFilename(value) {
  return (value ?? 'untitled')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/[「」]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 80);
}
