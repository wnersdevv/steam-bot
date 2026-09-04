'use strict';

const logger = require('../utils/logger');

/**
 * Basit, dependency-free bir queue.
 * - concurrency: aynı anda kaç iş çalışabilir
 * - retry: hata durumunda üstel geri çekilme (exponential backoff) ile tekrar dener
 */
class JobQueue {
  constructor({ concurrency = 3, maxRetries = 3, baseDelayMs = 1000, name = 'queue' } = {}) {
    this.concurrency = concurrency;
    this.maxRetries = maxRetries;
    this.baseDelayMs = baseDelayMs;
    this.name = name;
    this.pending = [];
    this.active = 0;
  }

  push(taskFn, { label } = {}) {
    return new Promise((resolve, reject) => {
      this.pending.push({ taskFn, label, attempt: 0, resolve, reject });
      this._drain();
    });
  }

  _drain() {
    while (this.active < this.concurrency && this.pending.length > 0) {
      const job = this.pending.shift();
      this.active++;
      this._run(job);
    }
  }

  async _run(job) {
    try {
      const result = await job.taskFn();
      job.resolve(result);
    } catch (err) {
      job.attempt++;
      if (job.attempt <= this.maxRetries) {
        const delay = this.baseDelayMs * 2 ** (job.attempt - 1);
        logger.warn(`Queue işi başarısız oldu, ${delay}ms sonra tekrar denenecek (deneme ${job.attempt}/${this.maxRetries})`, {
          queue: this.name,
          label: job.label,
          error: err.message,
        });
        setTimeout(() => {
          this.pending.unshift(job);
          this._drain();
        }, delay);
      } else {
        logger.error(`Queue işi ${this.maxRetries} denemeden sonra başarısız oldu`, err, { queue: this.name, label: job.label });
        job.reject(err);
      }
    } finally {
      this.active--;
      this._drain();
    }
  }

  get stats() {
    return { pending: this.pending.length, active: this.active, name: this.name };
  }
}

module.exports = { JobQueue };
