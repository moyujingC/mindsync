import { fetchBilibiliContents, internals as rssInternals } from '../platforms/bilibili/rss.mjs';

export async function diagnoseBilibiliSource({
  uid,
  creatorName = 'B站诊断账号',
  rsshubBaseUrls = [],
  timeoutMs = 10000,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!uid) {
    throw new Error('Missing Bilibili UID');
  }

  const creator = {
    id: `diagnose-bilibili-${uid}`,
    name: creatorName,
    platform: 'bilibili',
    externalId: String(uid),
  };
  const urls = rssInternals.buildBilibiliRssUrls(creator, {
    rsshubBaseUrls,
  });
  const results = [];

  for (const url of urls) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const contents = await fetchBilibiliContents({
        ...creator,
        source: {
          kind: 'rss',
          url,
        },
      }, {
        signal: controller.signal,
        fetchImpl,
        disableRsshubExpansion: true,
        rsshubBaseUrls: [new URL(url).origin],
      });
      results.push({
        url,
        ok: true,
        ms: Date.now() - startedAt,
        fetchedCount: contents.length,
        latest: contents[0] ? {
          uniqueKey: contents[0].uniqueKey,
          title: contents[0].title,
          url: contents[0].url,
          publishedAt: contents[0].publishedAt,
        } : null,
      });
    } catch (error) {
      results.push({
        url,
        ok: false,
        ms: Date.now() - startedAt,
        error: error.message,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    uid: String(uid),
    ok: results.some((result) => result.ok),
    checkedCount: results.length,
    results,
  };
}
