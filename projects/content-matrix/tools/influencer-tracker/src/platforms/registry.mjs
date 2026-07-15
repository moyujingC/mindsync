import { fetchBilibiliContents } from './bilibili/rss.mjs';

const adapters = {
  bilibili: fetchBilibiliContents,
};

export function getPlatformAdapter(platform) {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return adapter;
}
