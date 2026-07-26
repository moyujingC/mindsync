import { enrichVideoTranscripts } from './video-transcript.mjs';
import { collectTikHubResearch } from './tikhub-collect.mjs';

// Collect one content link as evidence. Each layer reports independently so a
// transcript or comments failure never discards already collected metadata.
export async function collectSingleContent({
  platform,
  shareUrl,
  client,
  feishuClient = null,
  feishuConfig = null,
  storePath,
  outputDir,
  includeContent = true,
  includeComments = false,
  commentLimit = 20,
  enrichVideo = enrichVideoTranscripts,
}) {
  const collection = await collectTikHubResearch({
    request: {
      mode: 'detail', platform, shareUrl,
      // L1 is always collected. L3 is opt-in only.
      includeComments, commentLimit,
    },
    client, feishuClient, feishuConfig, storePath,
  });
  const layers = {
    basicInfo: completed(collection.contents.fetchedCount > 0),
    content: { status: includeContent ? '处理中' : '未请求' },
    comments: includeComments
      ? completed(true, { count: collection.comments.fetchedCount })
      : { status: '未请求', count: 0 },
  };

  if (includeContent) {
    try {
      const enriched = await enrichVideo({ collection, outputDir });
      const media = enriched.media ?? { videoCount: 0, completedCount: 0, failedCount: 0, items: [] };
      layers.content = media.videoCount === 0
        ? completed(true, { source: '平台正文或简介', media })
        : media.failedCount > 0
          ? { status: '已降级', source: '部分视频未获得文字稿', media }
          : completed(true, { source: media.items[0]?.source ?? '视频文字稿', media });
      return { collection: enriched, layers };
    } catch (error) {
      layers.content = { status: '失败', error: summarizeError(error) };
    }
  }
  return { collection, layers };
}

function completed(ok, extra = {}) {
  return { status: ok ? '已完成' : '失败', ...extra };
}

function summarizeError(error) {
  return (error instanceof Error ? error.message : String(error ?? 'Unknown error')).replace(/\s+/g, ' ').slice(0, 300);
}
