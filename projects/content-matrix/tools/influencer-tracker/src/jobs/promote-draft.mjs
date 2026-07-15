import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export async function promoteDraftSeed({
  draftPath,
  account,
  accountsRoot,
  date = new Date().toISOString().slice(0, 10),
  overwrite = false,
}) {
  if (!draftPath) {
    throw new Error('Missing draftPath');
  }
  if (!account) {
    throw new Error('Missing account');
  }

  const raw = await readFile(draftPath, 'utf8');
  const draftSeed = parseDraftSeedMarkdown(raw);
  const accountDir = resolve(accountsRoot, account);
  const outputPath = join(accountDir, `${date}-${sanitizeFilename(draftSeed.title)}-草稿.md`);
  const content = renderAccountDraft({ draftSeed, account, sourcePath: draftPath });

  if (!overwrite && await exists(outputPath)) {
    throw new Error(`Draft already exists: ${outputPath}. Use --overwrite to replace it.`);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, 'utf8');

  return {
    account,
    title: draftSeed.title,
    sourceInsightRecordId: draftSeed.sourceInsightRecordId,
    outputPath,
  };
}

export function parseDraftSeedMarkdown(raw) {
  const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const sourceInsightRecordId = raw.match(/^>\s*source_insight_record_id：(.+)$/m)?.[1]?.trim();
  const section = (name) => extractSection(raw, name);

  if (!title) {
    throw new Error('Draft seed missing title');
  }

  return {
    title,
    sourceInsightRecordId,
    opening: section('开头草稿'),
    outline: parseList(section('草稿结构')),
    sourceEvidence: section('证据来源'),
    cta: section('CTA'),
    reviewChecklist: parseList(section('人工审核清单')),
  };
}

function renderAccountDraft({ draftSeed, account, sourcePath }) {
  return [
    `# ${draftSeed.title}`,
    '',
    `> 状态：草稿`,
    `> 来源：${sourcePath}`,
    `> source_insight_record_id：${draftSeed.sourceInsightRecordId ?? '待补充'}`,
    `> 目标账号：${account}`,
    '',
    '## 开头草稿',
    '',
    draftSeed.opening,
    '',
    '## 草稿结构',
    '',
    listOrFallback(draftSeed.outline, '待人工补充'),
    '',
    '## 证据来源',
    '',
    draftSeed.sourceEvidence,
    '',
    '## CTA',
    '',
    draftSeed.cta,
    '',
    '## 人工审核清单',
    '',
    listOrFallback(draftSeed.reviewChecklist, '待人工补充'),
    '',
    '## 待扩写正文',
    '',
    '待人工基于上方结构扩写。',
    '',
  ].join('\n');
}

function extractSection(raw, name) {
  const marker = `## ${name}`;
  const start = raw.indexOf(marker);
  if (start === -1) {
    return '';
  }
  const contentStart = start + marker.length;
  const nextSection = raw.indexOf('\n## ', contentStart);
  const end = nextSection === -1 ? raw.length : nextSection;
  return raw.slice(contentStart, end).trim();
}

function parseList(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());
}

function listOrFallback(items, fallback) {
  if (!items?.length) {
    return `- ${fallback}`;
  }
  return items.map((item) => `- ${item}`).join('\n');
}

async function exists(filePath) {
  try {
    await readFile(filePath, 'utf8');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function sanitizeFilename(value) {
  return (value ?? 'untitled')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/[「」]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 80);
}
