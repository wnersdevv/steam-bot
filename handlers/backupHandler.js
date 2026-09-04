'use strict';

const { AttachmentBuilder } = require('discord.js');
const { exportGuildData, importGuildData } = require('../services/backupService');
const { requireAdmin } = require('../utils/permissions');
const { addAuditLog } = require('../services/auditService');

async function handleBackupExport(interaction) {
  if (!(await requireAdmin(interaction))) return;
  await interaction.deferReply({ ephemeral: true });

  const result = await exportGuildData(interaction.guildId);
  await addAuditLog({ guildId: interaction.guildId, userId: interaction.user.id, action: 'yedek_alindi' });

  const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(result.payload, null, 2), 'utf8'), {
    name: `wnersdev-backup-${interaction.guildId}.json`,
  });

  await interaction.editReply({ content: '✅ Yedek oluşturuldu.', files: [attachment] });
}

async function handleBackupImport(interaction) {
  if (!(await requireAdmin(interaction))) return;
  const attachment = interaction.options.getAttachment('dosya', true);

  await interaction.deferReply({ ephemeral: true });

  if (!attachment.name.endsWith('.json')) {
    return interaction.editReply({ content: '❌ Yalnızca .json dosyaları kabul edilir.' });
  }
  if (attachment.size > 5 * 1024 * 1024) {
    return interaction.editReply({ content: '❌ Dosya çok büyük (maks 5MB).' });
  }

  let payload;
  try {
    const res = await fetch(attachment.url);
    const text = await res.text();
    payload = JSON.parse(text);
  } catch (err) {
    return interaction.editReply({ content: `❌ Dosya okunamadı/geçersiz JSON: ${err.message}` });
  }

  const result = await importGuildData(interaction.guildId, payload);
  if (!result.ok) {
    return interaction.editReply({ content: `❌ İçe aktarma başarısız:\n${result.errors?.join('\n') || result.reason}` });
  }

  await addAuditLog({ guildId: interaction.guildId, userId: interaction.user.id, action: 'yedek_geri_yuklendi', metadata: { importedGames: result.importedGames } });

  await interaction.editReply({
    content: `✅ İçe aktarma tamamlandı.\nİçe aktarılan takip: ${result.importedGames}\nAtlanan (eksik veri): ${result.skippedGames}`,
  });
}

module.exports = { handleBackupExport, handleBackupImport };
