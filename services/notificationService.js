'use strict';

const { buildPanel, panelPayload } = require('../components/v2Builder');
const logger = require('../utils/logger');

async function sendChannelPanel(client, channelId, { accentColor, title, description }) {
  try {
    if (!channelId) return { ok: false, reason: 'no_channel' };
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return { ok: false, reason: 'channel_not_found' };

    const container = buildPanel({
      accentColor,
      blocks: [{ type: 'text', content: `## ${title}` }, { type: 'text', content: description }],
    });
    await channel.send(panelPayload(container, { ephemeral: false }));
    return { ok: true };
  } catch (err) {
    logger.warn('Kanala bildirim gönderilemedi', { channelId, error: err.message });
    return { ok: false, reason: 'send_failed' };
  }
}

async function sendDm(client, userId, { title, description }) {
  try {
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return { ok: false, reason: 'user_not_found' };
    const container = buildPanel({
      accentColor: 0x5865f2,
      blocks: [{ type: 'text', content: `## ${title}` }, { type: 'text', content: description }],
    });
    await user.send(panelPayload(container, { ephemeral: false }));
    return { ok: true };
  } catch (err) {
    logger.warn('DM gönderilemedi (kapalı olabilir)', { userId, error: err.message });
    return { ok: false, reason: 'dm_closed' };
  }
}

module.exports = { sendChannelPanel, sendDm };
