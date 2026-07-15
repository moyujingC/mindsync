import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export async function scaffoldFinalDraft({
  editPackagePath,
  account,
  accountsRoot,
  date = new Date().toISOString().slice(0, 10),
  overwrite = false,
}) {
  if (!editPackagePath) {
    throw new Error('Missing editPackagePath');
  }
  if (!account) {
    throw new Error('Missing account');
  }

  const raw = await readFile(editPackagePath, 'utf8');
  const editPackage = parseEditPackageMarkdown(raw);
  const accountDir = resolve(accountsRoot, account);
  const outputPath = join(accountDir, `${date}-${sanitizeFilename(editPackage.title)}-成稿.md`);
  const content = renderFinalSkeleton({ editPackage, account, editPackagePath });

  if (!overwrite && await exists(outputPath)) {
    throw new Error(`Final draft already exists: ${outputPath}. Use --overwrite to replace it.`);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, 'utf8');

  return {
    account,
    title: editPackage.title,
    outputPath,
  };
}

export function parseEditPackageMarkdown(raw) {
  const titleWithSuffix = raw.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title = titleWithSuffix?.replace(/\s+-\s+成稿编辑任务包$/, '') ?? 'untitled';
  const draftSource = raw.match(/^>\s*草稿来源：(.+)$/m)?.[1]?.trim();
  const originalDraft = extractSection(raw, '原始草稿');

  return {
    title,
    draftSource,
    originalDraft,
  };
}

function renderFinalSkeleton({ editPackage, account, editPackagePath }) {
  return [
    `# ${editPackage.title}`,
    '',
    `> 状态：待人工编辑`,
    `> 目标账号：${account}`,
    `> 成稿编辑任务包：${editPackagePath}`,
    `> 草稿来源：${editPackage.draftSource ?? '待补充'}`,
    '',
    '## 编辑进度',
    '',
    '- [ ] 结构审稿已完成',
    '- [ ] 表达降噪已完成',
    '- [ ] 风格校准已完成',
    '- [ ] 待发检查已完成',
    '- [ ] 来源内容已人工复核',
    '',
    '## 成稿正文',
    '',
    '待人工基于下方原始草稿编辑。',
    '',
    '## 原始草稿备份',
    '',
    editPackage.originalDraft,
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
