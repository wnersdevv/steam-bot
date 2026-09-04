'use strict';

const crypto = require('crypto');

const SESSION_TTL_MS = 15 * 60 * 1000;
const sessions = new Map();

function createSession(ownerId, data = {}) {
  const id = crypto.randomBytes(4).toString('hex');
  sessions.set(id, { ownerId, data, expiresAt: Date.now() + SESSION_TTL_MS });
  return id;
}

function getSession(id) {
  const session = sessions.get(id);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(id);
    return null;
  }
  return session;
}

function updateSession(id, patch) {
  const session = getSession(id);
  if (!session) return null;
  session.data = { ...session.data, ...patch };
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(id, session);
  return session;
}

function deleteSession(id) {
  sessions.delete(id);
}

function isOwner(sessionId, userId) {
  const session = getSession(sessionId);
  if (!session) return false;
  return session.ownerId === userId;
}

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt < now) sessions.delete(id);
  }
}, 5 * 60 * 1000).unref();

module.exports = { createSession, getSession, updateSession, deleteSession, isOwner };
