'use strict';

const { SlashCommandBuilder, ChannelType } = require('discord.js');
const giveaway = require('../handlers/giveawayHandler');

const data = new SlashCommandBuilder()
  .setName('cekilis')
  .setDescription('Çekiliş yönetimi')
  .addSubcommand((sub) =>
    sub
      .setName('baslat')
      .setDescription('Yeni bir çekiliş başlat (yönetici)')
      .addStringOption((opt) => opt.setName('odul').setDescription('Çekiliş ödülü').setRequired(true))
      .addStringOption((opt) => opt.setName('sure').setDescription('Süre (ör: 10dk, 1h, 2gün)').setRequired(true))
      .addIntegerOption((opt) => opt.setName('kazanan-sayisi').setDescription('Kazanan sayısı (varsayılan: 1)').setMinValue(1).setMaxValue(20))
      .addChannelOption((opt) => opt.setName('kanal').setDescription('Çekilişin gönderileceği kanal').addChannelTypes(ChannelType.GuildText))
  )
  .addSubcommand((sub) =>
    sub
      .setName('bitir')
      .setDescription('Bir çekilişi erken bitir (yönetici)')
      .addStringOption((opt) => opt.setName('id').setDescription('Çekiliş ID (bkz. /cekilis liste)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('iptal')
      .setDescription('Bir çekilişi iptal et (yönetici)')
      .addStringOption((opt) => opt.setName('id').setDescription('Çekiliş ID (bkz. /cekilis liste)').setRequired(true))
  )
  .addSubcommand((sub) => sub.setName('liste').setDescription('Aktif çekilişleri listele'));

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'baslat') return giveaway.handleGiveawayStart(interaction);
  if (sub === 'bitir') return giveaway.handleGiveawayEnd(interaction);
  if (sub === 'iptal') return giveaway.handleGiveawayCancel(interaction);
  if (sub === 'liste') return giveaway.handleGiveawayList(interaction);
  return interaction.reply({ content: '❌ Bilinmeyen komut.', ephemeral: true });
}

module.exports = { data, execute };
