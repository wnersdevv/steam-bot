'use strict';

const buckets = new Map();

/**
 * Sabit pencereli rate limit. key bazında ayrı sayaç tutar.
 * checkRateLimit(`oyunara:${userId}`, 5, 10000) -> 10 saniyede en fazla 5 istek.
 */
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60 * 1000).unref();

module.exports = { checkRateLimit };
