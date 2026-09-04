'use strict';

const crypto = require('crypto');

function generateId(prefix) {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

module.exports = { generateId };
