'use strict';

const logger = require('../utils/logger');

let AI_CONFIG = { configured: false };

function configureAiService(aiConfig) {
  AI_CONFIG = aiConfig || { configured: false };
}

function isAiConfigured() {
  return Boolean(AI_CONFIG.configured);
}

/**
 * Anthropic Messages API'ye tek seferlik bir tamamlama isteği gönderir.
 * AI yapılandırılmamışsa (apiKey yok / enabled:false) sahte bir yanıt
 * ÜRETMEZ — { ok:false, reason:'not_configured' } döner. Çağıran taraf
 * bunu kullanıcıya "AI özelliği yapılandırılmamış" olarak iletmelidir.
 */
async function generateText(prompt, { maxTokens = 500 } = {}) {
  if (!isAiConfigured()) {
    return { ok: false, reason: 'not_configured' };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_CONFIG.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_CONFIG.model || 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.error('AI isteği başarısız oldu', new Error(`HTTP ${res.status}`), { status: res.status, body: text.slice(0, 200) });
      return { ok: false, reason: 'api_error', status: res.status };
    }

    const data = await res.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    if (!textBlock) return { ok: false, reason: 'empty_response' };

    return { ok: true, text: textBlock.text };
  } catch (err) {
    logger.error('AI isteği sırasında ağ hatası', err);
    return { ok: false, reason: 'network_error', detail: err.message };
  }
}

module.exports = { configureAiService, isAiConfigured, generateText };
