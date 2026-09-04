'use strict';

const steam = require('./steam');
const cekilis = require('./cekilis');
const status = require('./status');
const yardim = require('./yardim');
const panel = require('./panel');

const commands = [steam, cekilis, status, yardim, panel];

function buildCommandCollection() {
  const map = new Map();
  for (const cmd of commands) map.set(cmd.data.name, cmd);
  return map;
}

function getCommandJson() {
  return commands.map((c) => c.data.toJSON());
}

module.exports = { commands, buildCommandCollection, getCommandJson };
