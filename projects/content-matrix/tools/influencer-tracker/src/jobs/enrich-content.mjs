import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { readJsonFile, writeJsonFile } from '../utils/json-file.mjs';
import { writeJobManifest } from '../utils/manifest.mjs';
import { normalizeBilibiliComments } from './sync-bilibili-comments.mjs';

const SERVICE_KEYWORDS = [
  ['AI 工作流诊断', ['流程', '工作流', '自动化', 'AI', 'agent', 'Agent', '服务']],
  ['AI 文档 / 知识库整理', ['资料', '文档', '知识库', '整理', '沉淀', '复用']],
  ['内容生产系统', ['内容', '选题', '草稿', '成稿', '配图', '发布', '评论区']],
  ['企业 AI 落地 / FDE', ['企业', '团队', '落地', '试点', '协作', '交付']],
];

export async function enrichContentArtifact({
  artifactDir,
  commentsPath = null,
}) {
  const resolvedArtifactDir = resolve(artifactDir);
  const metadata = await readJsonFile(join(resolvedArtifactDir, 'metadata.json'));
  const transcript = await readOptionalText(join(resolvedArtifactDir, 'speech-clean.txt'));
  const comments = commentsPath
    ? normalizeBilibiliComments(await readJsonFile(resolve(commentsPath)))
    : [];

  const analysis = buildContentEnrichment({
    metadata,
    transcript,
    comments,
  });

  const outputPath = join(resolvedArtifactDir, 'enrichment.json');
  const manifestPath = join(resolvedArtifactDir, 'enrich-manifest.json');
  await writeJsonFile(outputPath, analysis);
  await writeJobManifest({
    manifestPath,
    job: 'enrich',
    status: 'ok',
    input: {
      artifactDir: resolvedArtifactDir,
      metadataPath: join(resolvedArtifactDir, 'metadata.json'),
      transcriptPath: transcript ? join(resolvedArtifactDir, 'speech-clean.txt') : null,
      commentsPath: commentsPath ? resolve(commentsPath) : null,
    },
    output: {
      outputPath,
      insightCount: analysis.insights.length,
      topicCandidateCount: analysis.topicCandidates.length,
      sourceCommentCount: comments.length,
    },
  });

  return {
    outputPath,
    manifestPath,
    analysis,
  };
}

export function buildContentEnrichment({ metadata, transcript = '', comments = [] }) {
  const text = [
    metadata.title,
    metadata.description,
    transcript,
    ...comments.map((comment) => comment.commentText),
  ].filter(Boolean).join('\n');
  const serviceDirections = inferServiceDirections(text);
  const demandSignals = buildDemandSignals(comments);
  const primaryDirection = serviceDirections[0] ?? inferDirectionFromComments(demandSignals) ?? '待人工判断';
  const userProblems = inferUserProblems({ transcript, comments, primaryDirection });

  return {
    schema: 'content-matrix/content-enrichment/v1',
    generatedAt: new Date().toISOString(),
    source: {
      platform: metadata.platform,
      creatorName: metadata.creatorName,
      creatorExternalId: metadata.creatorExternalId,
      contentExternalId: metadata.contentExternalId,
      title: metadata.title,
      url: metadata.url,
      publishedAt: metadata.publishedAt,
    },
    serviceDirections,
    primaryDirection,
    demandSignals,
    userProblems,
    insights: buildInsights({ metadata, primaryDirection, userProblems, demandSignals }),
    topicCandidates: buildTopicCandidates({ metadata, primaryDirection, userProblems, demandSignals }),
    evidence: {
      transcriptExcerpt: truncateText(transcript, 240),
      commentCount: comments.length,
      topComments: comments.slice(0, 5).map((comment) => ({
        commentUniqueKey: comment.commentUniqueKey,
        commentText: comment.commentText,
        likeCount: comment.likeCount,
        demandType: comment.demandType,
      })),
    },
    reviewStatus: '待人工审核',
  };
}

function inferServiceDirections(text) {
  const normalized = text.toLowerCase();
  return SERVICE_KEYWORDS
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword.toLowerCase())))
    .map(([direction]) => direction);
}

function buildDemandSignals(comments) {
  const counts = {};
  for (const comment of comments) {
    for (const demandType of comment.demandType ?? []) {
      counts[demandType] = (counts[demandType] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type));
}

function inferDirectionFromComments(demandSignals) {
  if (demandSignals.some((signal) => signal.type === '购买意向' || signal.type === '问题咨询')) {
    return 'AI 工作流诊断';
  }
  return null;
}

function inferUserProblems({ transcript, comments, primaryDirection }) {
  const questions = comments
    .map((comment) => comment.commentText)
    .filter((text) => /怎么|如何|能不能|有没有|为什么|？|\?/.test(text));

  if (questions.length > 0) {
    return questions.slice(0, 3);
  }

  if (primaryDirection === '内容生产系统') {
    return ['内容生产链路需要从评论区需求回到选题库。'];
  }
  if (primaryDirection === 'AI 工作流诊断') {
    return ['用户对 AI 服务如何落到具体流程仍需要更清晰的拆解。'];
  }
  if (transcript) {
    return ['需要人工复核转写稿，判断是否存在可服务的具体问题。'];
  }
  return ['需要人工补充用户问题。'];
}

function buildInsights({ metadata, primaryDirection, userProblems, demandSignals }) {
  const signalText = demandSignals.length
    ? demandSignals.map((signal) => `${signal.type} x${signal.count}`).join('，')
    : '暂无结构化评论标签';
  return [{
    insightType: '用户需求',
    title: `从「${metadata.title}」看${primaryDirection}的需求信号`,
    evidenceSummary: [
      `来源内容：${metadata.title}`,
      `评论信号：${signalText}`,
      `用户问题：${userProblems[0]}`,
    ].join('\n'),
    nextAction: '人工复核原内容、转写稿和评论区，再决定是否写入飞书洞察表。',
  }];
}

function buildTopicCandidates({ metadata, primaryDirection, userProblems, demandSignals }) {
  return [{
    topicTitle: `从「${metadata.title}」拆解${primaryDirection}的真实需求`,
    serviceDirection: primaryDirection,
    userProblem: userProblems[0],
    evidenceSummary: demandSignals.length
      ? `评论区出现 ${demandSignals.map((signal) => `${signal.type} ${signal.count} 条`).join('、')}。`
      : '暂未发现结构化评论标签，需人工复核。',
    nextAction: '先写成问题拆解型内容，不直接做服务承诺。',
    status: '待人工审核',
  }];
}

async function readOptionalText(filePath) {
  try {
    return (await readFile(filePath, 'utf8')).trim();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

function truncateText(text, maxLength) {
  if (!text) {
    return '';
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
