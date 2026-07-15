import { resolve } from 'node:path';
import { fetchBilibiliContents } from '../platforms/bilibili/rss.mjs';
import { downloadBilibiliArtifact, downloadWithYtDlp } from '../platforms/bilibili/download.mjs';

export async function downloadLatestBilibili({
  creator,
  outputRoot,
  limit = 1,
  downloader,
  downloadMode = 'metadata-only',
  cwd = process.cwd(),
}) {
  const contents = await fetchBilibiliContents(creator, { cwd });
  const selected = contents.slice(0, limit);
  const results = [];

  for (const content of selected) {
    const artifact = await downloadBilibiliArtifact(content, {
      creator,
      outputRoot: resolve(cwd, outputRoot),
      downloader: downloader ?? selectDownloader(downloadMode),
    });
    results.push({
      content,
      artifact,
    });
  }

  return {
    creator: {
      name: creator.name,
      externalId: creator.externalId,
    },
    count: results.length,
    results,
  };
}

function selectDownloader(downloadMode) {
  if (downloadMode === 'yt-dlp') {
    return downloadWithYtDlp;
  }
  return null;
}
