import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchBilibiliContentsWithYtDlp,
  parseYtDlpFlatPlaylist,
} from '../src/platforms/bilibili/yt-dlp.mjs';

test('parseYtDlpFlatPlaylist reads newline-delimited playlist items', () => {
  const items = parseYtDlpFlatPlaylist([
    JSON.stringify({ id: 'BV166Ni6JESi', url: 'https://www.bilibili.com/video/BV166Ni6JESi' }),
    JSON.stringify({ id: 'BV126M76EEPz', webpage_url: 'https://www.bilibili.com/video/BV126M76EEPz' }),
  ].join('\n'));

  assert.equal(items.length, 2);
  assert.equal(items[0].id, 'BV166Ni6JESi');
});

test('fetchBilibiliContentsWithYtDlp normalizes flat playlist items', async () => {
  const contents = await fetchBilibiliContentsWithYtDlp({
    name: '第四种黑猩猩',
    externalId: '3546830396721763',
  }, {
    limit: 2,
    execFileImpl: async (bin, args) => {
      assert.equal(bin, 'yt-dlp');
      assert.deepEqual(args.slice(0, 5), [
        '--no-warnings',
        '--flat-playlist',
        '--dump-json',
        '--playlist-end',
        '2',
      ]);
      return {
        stdout: `${JSON.stringify({
          id: 'BV166Ni6JESi',
          url: 'https://www.bilibili.com/video/BV166Ni6JESi',
        })}\n`,
      };
    },
  });

  assert.equal(contents.length, 1);
  assert.equal(contents[0].uniqueKey, 'bilibili:BV166Ni6JESi');
  assert.equal(contents[0].creatorName, '第四种黑猩猩');
  assert.equal(contents[0].raw.source, 'yt-dlp-flat-playlist');
});
