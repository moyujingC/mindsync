import test from 'node:test';
import assert from 'node:assert/strict';
import { describeContentLink, resolveContentLink, resolveDetailContentLink } from '../src/platforms/content-link.mjs';

test('resolveContentLink follows a known short link and identifies a Xiaohongshu content URL', async () => {
  const requested = [];
  const result = await resolveContentLink({
    url: 'https://xhslink.com/short-case',
    fetchImpl: async (url, options) => {
      requested.push({ url: String(url), options });
      if (String(url).includes('xhslink.com')) return redirect('https://www.xiaohongshu.com/explore/note-001?xsec_token=keep-for-collection');
      return response(200);
    },
  });

  assert.equal(result.platform, 'xiaohongshu');
  assert.equal(result.kind, 'content');
  assert.equal(result.contentId, 'note-001');
  assert.equal(result.finalUrl, 'https://www.xiaohongshu.com/explore/note-001?xsec_token=keep-for-collection');
  assert.equal(requested[0].options.redirect, 'manual');
});

test('describeContentLink identifies WeChat MP articles without a network request', () => {
  const result = describeContentLink({
    originalUrl: 'https://mp.weixin.qq.com/s?__biz=abc&mid=123&idx=1',
    finalUrl: 'https://mp.weixin.qq.com/s?__biz=abc&mid=123&idx=1',
  });

  assert.equal(result.platform, 'wechat_mp');
  assert.equal(result.kind, 'content');
  assert.equal(result.contentId, '123');
});

test('describeContentLink extracts a Douyin sec_uid from a creator homepage', () => {
  const result = describeContentLink({
    originalUrl: 'https://www.douyin.com/user/dyo59example?sec_uid=MS4wLjABAAAA-sec-user',
    finalUrl: 'https://www.douyin.com/user/dyo59example?sec_uid=MS4wLjABAAAA-sec-user',
  });

  assert.equal(result.kind, 'creator');
  assert.equal(result.platform, 'douyin');
  assert.equal(result.creatorId, 'MS4wLjABAAAA-sec-user');
});

test('resolveContentLink does not fetch an already recognized content URL', async () => {
  const result = await resolveContentLink({
    url: 'https://mp.weixin.qq.com/s?__biz=abc&mid=123&idx=1',
    fetchImpl: async () => {
      throw new Error('direct links must not be fetched for resolution');
    },
  });

  assert.equal(result.kind, 'content');
  assert.equal(result.platform, 'wechat_mp');
});

test('resolveDetailContentLink rejects creator pages and unsafe redirect targets', async () => {
  await assert.rejects(
    () => resolveDetailContentLink({
      url: 'https://www.douyin.com/user/example',
      fetchImpl: async () => response(200),
    }),
    /creator, not a content detail/,
  );
  await assert.rejects(
    () => resolveContentLink({
      url: 'https://v.douyin.com/short-case',
      fetchImpl: async () => redirect('http://127.0.0.1/internal'),
    }),
    /Unsupported or unsafe link host/,
  );
});

function response(status) {
  return { status, headers: new Headers() };
}

function redirect(location) {
  return { status: 302, headers: new Headers({ location }) };
}
