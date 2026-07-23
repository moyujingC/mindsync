export function createFeishuGroupNotifier({ webhookUrl = process.env.FEISHU_GROUP_WEBHOOK_URL, fetchImpl = globalThis.fetch } = {}) {
  if (!webhookUrl?.trim()) return null;
  const url = new URL(webhookUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'open.feishu.cn') {
    throw new Error('FEISHU_GROUP_WEBHOOK_URL must be an HTTPS open.feishu.cn webhook URL');
  }
  return async ({ title, lines }) => {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        msg_type: 'text',
        content: { text: [title, ...lines].filter(Boolean).join('\n') },
      }),
    });
    if (!response.ok) throw new Error(`Feishu group webhook failed: ${response.status}`);
  };
}

export async function notifySafely(notify, message, logger = console) {
  if (!notify) return { sent: false, reason: 'not-configured' };
  try {
    await notify(message);
    return { sent: true };
  } catch (error) {
    logger.warn?.(`[link-inbox] group notification failed: ${error.message}`);
    return { sent: false, reason: 'delivery-failed' };
  }
}
