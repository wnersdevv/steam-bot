'use strict';

/**
 * Basit in-memory TTL cache. Steam API çağrılarının sıklığını azaltmak için
 * kullanılır. Kalıcı veri kaynağı her zaman MongoDB'dir — cache sadece
 * performans amaçlıdır ve bot yeniden başladığında sıfırlanır.
 */
class TtlCache {
  constructor(defaultTtlMs = 60000) {
    this.store = new Map();
    this.defaultTtlMs = defaultTtlMs;
    setInterval(() => this._sweep(), 5 * 60 * 1000).unref();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
    return value;
  }

  delete(key) {
    this.store.delete(key);
  }

  async wrap(key, ttlMs, producer) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const value = await producer();
    if (value !== undefined && value !== null) this.set(key, value, ttlMs);
    return value;
  }

  _sweep() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) this.store.delete(key);
    }
  }

  get size() {
    return this.store.size;
  }
}

module.exports = { TtlCache, cache: new TtlCache() };
