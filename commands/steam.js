'use strict';

const { SlashCommandBuilder, ChannelType } = require('discord.js');
const account = require('../handlers/accountHandler');
const game = require('../handlers/gameHandler');
const tracking = require('../handlers/trackingHandler');
const achievement = require('../handlers/achievementHandler');
const friends = require('../handlers/friendsHandler');
const news = require('../handlers/newsHandler');
const leaderboard = require('../handlers/leaderboardHandler');
const stats = require('../handlers/statsHandler');
const settings = require('../handlers/settingsHandler');
const backup = require('../handlers/backupHandler');
const sync = require('../handlers/syncHandler');

const data = new SlashCommandBuilder()
  .setName('steam')
  .setDescription('WNERSDEV Steam entegrasyon komutları')
  .addSubcommandGroup((group) =>
    group
      .setName('hesap')
      .setDescription('Steam hesabı yönetimi')
      .addSubcommand((sub) =>
        sub
          .setName('bagla')
          .setDescription('Steam hesabını Discord hesabına bağla')
          .addStringOption((opt) => opt.setName('steamid').setDescription('SteamID64, vanity adı veya profil linki').setRequired(true))
      )
      .addSubcommand((sub) => sub.setName('kaldir').setDescription('Bağlı Steam hesabını kaldır'))
      .addSubcommand((sub) => sub.setName('yenile').setDescription('Bağlı Steam hesabının bilgilerini tazele'))
  )
  .addSubcommand((sub) =>
    sub
      .setName('profil')
      .setDescription('Steam profilini görüntüle')
      .addUserOption((opt) => opt.setName('kullanici').setDescription('Profili görüntülenecek kullanıcı (boş = kendin)'))
  )
  .addSubcommandGroup((group) =>
    group
      .setName('oyun')
      .setDescription('Oyun arama ve bilgi')
      .addSubcommand((sub) =>
        sub
          .setName('ara')
          .setDescription('Steam mağazasında oyun ara')
          .addStringOption((opt) => opt.setName('isim').setDescription('Oyun adı').setRequired(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('bilgi')
          .setDescription('Bir oyunun detaylarını göster')
          .addIntegerOption((opt) => opt.setName('appid').setDescription('Steam appid').setRequired(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('fiyat')
          .setDescription('Bir oyunun güncel fiyatını göster')
          .addIntegerOption((opt) => opt.setName('appid').setDescription('Steam appid').setRequired(true))
      )
  )
  .addSubcommandGroup((group) =>
    group
      .setName('takip')
      .setDescription('Fiyat/başarım takibi')
      .addSubcommand((sub) =>
        sub
          .setName('ekle')
          .setDescription('Bir oyunu takip listene ekle')
          .addIntegerOption((opt) => opt.setName('appid').setDescription('Steam appid').setRequired(true))
          .addBooleanOption((opt) => opt.setName('fiyat').setDescription('Fiyat takibi (varsayılan: açık)'))
          .addBooleanOption((opt) => opt.setName('basarim').setDescription('Başarım takibi (varsayılan: kapalı)'))
          .addNumberOption((opt) => opt.setName('hedef-fiyat').setDescription('Bu fiyata inince bildirim al'))
      )
      .addSubcommand((sub) =>
        sub
          .setName('kaldir')
          .setDescription('Bir oyunu takip listenden çıkar')
          .addIntegerOption((opt) => opt.setName('appid').setDescription('Steam appid').setRequired(true))
      )
      .addSubcommand((sub) => sub.setName('liste').setDescription('Takip listeni göster'))
  )
  .addSubcommandGroup((group) =>
    group
      .setName('basarim')
      .setDescription('Başarım sistemi')
      .addSubcommand((sub) =>
        sub
          .setName('goster')
          .setDescription('Bir oyundaki başarım ilerlemesini göster')
          .addIntegerOption((opt) => opt.setName('appid').setDescription('Steam appid').setRequired(true))
          .addUserOption((opt) => opt.setName('kullanici').setDescription('Kullanıcı (boş = kendin)'))
      )
  )
  .addSubcommandGroup((group) =>
    group
      .setName('arkadaslar')
      .setDescription('Steam arkadaş/durum sistemi')
      .addSubcommand((sub) =>
        sub
          .setName('goster')
          .setDescription('Steam arkadaş listesini ve durumlarını göster')
          .addUserOption((opt) => opt.setName('kullanici').setDescription('Kullanıcı (boş = kendin)'))
      )
  )
  .addSubcommandGroup((group) =>
    group
      .setName('haber')
      .setDescription('Oyun haber takibi (yönetici)')
      .addSubcommand((sub) =>
        sub
          .setName('ekle')
          .setDescription('Bir oyunun haberlerini bir kanala bağla')
          .addIntegerOption((opt) => opt.setName('appid').setDescription('Steam appid').setRequired(true))
          .addChannelOption((opt) => opt.setName('kanal').setDescription('Haberlerin gönderileceği kanal').addChannelTypes(ChannelType.GuildText).setRequired(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('kaldir')
          .setDescription('Bir oyunun haber takibini kaldır')
          .addIntegerOption((opt) => opt.setName('appid').setDescription('Steam appid').setRequired(true))
      )
      .addSubcommand((sub) => sub.setName('liste').setDescription('Takip edilen oyun haberlerini listele'))
  )
  .addSubcommand((sub) =>
    sub
      .setName('leaderboard')
      .setDescription('Sunucu liderlik tablosu')
      .addStringOption((opt) =>
        opt
          .setName('tur')
          .setDescription('Liderlik tablosu türü')
          .addChoices({ name: 'Başarım', value: 'basarim' }, { name: 'Takip', value: 'takip' }, { name: 'Çekiliş', value: 'cekilis' })
      )
  )
  .addSubcommand((sub) => sub.setName('istatistik').setDescription('Sunucu istatistiklerini göster'))
  .addSubcommand((sub) => sub.setName('ayarlar').setDescription('Bot ayarlarını yönet (yönetici)'))
  .addSubcommand((sub) => sub.setName('senkronize').setDescription('Takip verilerini Steam ile senkronize et (yönetici)'))
  .addSubcommandGroup((group) =>
    group
      .setName('yedek')
      .setDescription('Yedekleme')
      .addSubcommand((sub) => sub.setName('al').setDescription('Sunucu verilerini JSON olarak dışa aktar (yönetici)'))
      .addSubcommand((sub) =>
        sub
          .setName('geri-yukle')
          .setDescription('Bir JSON yedeğini içe aktar (yönetici)')
          .addAttachmentOption((opt) => opt.setName('dosya').setDescription('Yedek JSON dosyası').setRequired(true))
      )
  );

async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand(false);

  if (group === 'hesap') {
    if (sub === 'bagla') return account.handleLink(interaction);
    if (sub === 'kaldir') return account.handleUnlink(interaction);
    if (sub === 'yenile') return account.handleRefresh(interaction);
  } else if (group === 'oyun') {
    if (sub === 'ara') return game.handleSearch(interaction);
    if (sub === 'bilgi') return game.handleGameInfo(interaction);
    if (sub === 'fiyat') return game.handlePrice(interaction);
  } else if (group === 'takip') {
    if (sub === 'ekle') return tracking.handleTrackAdd(interaction);
    if (sub === 'kaldir') return tracking.handleTrackRemove(interaction);
    if (sub === 'liste') return tracking.handleTrackList(interaction);
  } else if (group === 'basarim') {
    if (sub === 'goster') return achievement.handleAchievements(interaction);
  } else if (group === 'arkadaslar') {
    if (sub === 'goster') return friends.handleFriends(interaction);
  } else if (group === 'haber') {
    if (sub === 'ekle') return news.handleNewsAdd(interaction);
    if (sub === 'kaldir') return news.handleNewsRemove(interaction);
    if (sub === 'liste') return news.handleNewsList(interaction);
  } else if (group === 'yedek') {
    if (sub === 'al') return backup.handleBackupExport(interaction);
    if (sub === 'geri-yukle') return backup.handleBackupImport(interaction);
  } else if (sub === 'profil') {
    return account.handleProfile(interaction);
  } else if (sub === 'leaderboard') {
    return leaderboard.handleLeaderboard(interaction);
  } else if (sub === 'istatistik') {
    return stats.handleStats(interaction);
  } else if (sub === 'ayarlar') {
    return settings.handleSettingsCommand(interaction);
  } else if (sub === 'senkronize') {
    return sync.handleSync(interaction);
  }

  return interaction.reply({ content: '❌ Bilinmeyen komut.', ephemeral: true });
}

module.exports = { data, execute };
