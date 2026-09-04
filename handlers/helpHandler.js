'use strict';

const { buildPanel, panelPayload } = require('../components/v2Builder');
const { backHomeRow } = require('./panelHandler');

async function handleHelp(interaction) {
  const container = buildPanel({
    accentColor: 0x5865f2,
    blocks: [
      { type: 'text', content: '## ❓ YARDIM' },
      {
        type: 'text',
        content:
          '**🎮 Hesap**\n`/steam hesap bağla` · `/steam hesap kaldır` · `/steam hesap yenile` · `/steam profil`\n\n' +
          '**🔍 Oyunlar**\n`/steam oyun ara` · `/steam oyun bilgi` · `/steam oyun fiyat`\n\n' +
          '**📋 Takip**\n`/steam takip ekle` · `/steam takip kaldır` · `/steam takip liste`\n\n' +
          '**🏆 Başarım & Arkadaşlar**\n`/steam basarim goster` · `/steam arkadaslar goster`\n\n' +
          '**📰 Haberler (yönetici)**\n`/steam haber ekle` · `/steam haber kaldır` · `/steam haber liste`\n\n' +
          '**🎉 Çekiliş**\n`/cekilis baslat` · `/cekilis bitir` · `/cekilis iptal` · `/cekilis liste`\n\n' +
          '**📊 Diğer**\n`/steam leaderboard` · `/steam istatistik` · `/steam ayarlar` · `/steam yedek al` · `/steam yedek geri-yukle` · `/steam senkronize` · `/status` · `/panel`',
      },
      { type: 'actionRow', row: backHomeRow() },
    ],
  });

  await interaction.reply(panelPayload(container, { ephemeral: true }));
}

module.exports = { handleHelp };
