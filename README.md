<div align="center">

![Banner](https://capsule-render.vercel.app/api?type=waving&color=0:1b2838,50:2a475e,100:66c0f4&height=220&section=header&text=WNERSDEV%20ULTIMATE%20STEAM%20BOT&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Discord%20%2B%20Steam%20%2B%20Components%20V2%20%2B%20MongoDB&descAlignY=58&descSize=18)

![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&duration=2500&pause=800&color=66C0F4&center=true&vCenter=true&width=750&lines=Discord+sunucunda+tam+bir+Steam+merkezi+kur;Fiyat+%2B+ba%C5%9Far%C4%B1m+%2B+haber+takibi+otomatik+%C3%A7al%C4%B1%C5%9F%C4%B1r;%C3%87ekili%C5%9F%2C+leaderboard%2C+panel%2C+yedekleme+dahil;Dashboard+yok+%E2%80%94+her+%C5%9Fey+Discord+i%C3%A7inde)

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-3C873A?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![discord.js](https://img.shields.io/badge/discord.js-v14.16-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Steam](https://img.shields.io/badge/Steam%20Web%20API-Entegre-171a21?style=for-the-badge&logo=steam&logoColor=white)](https://steamcommunity.com/dev)
[![License](https://img.shields.io/badge/Lisans-Belirtilmemi%C5%9F-lightgrey?style=for-the-badge)]()

**⚡ Powered By WnersDev ⚡**

</div>

---

## 📌 İçindekiler

- [Bu Bot Ne Yapar?](#-bu-bot-ne-yapar)
- [Öne Çıkan Özellikler](#-öne-çıkan-özellikler)
- [Proje Mimarisi](#-proje-mimarisi)
- [Kurulum](#-kurulum-adım-adım)
- [ayarlar.json Referansı](#-ayarlarjson-referansı)
- [Discord Developer Portal](#-discord-developer-portal-kurulumu)
- [MongoDB Kurulumu](#-mongodb-kurulumu)
- [Steam Web API Anahtarı](#-steam-web-api-anahtarı)
- [Botu Başlatma (Komut Açılışları)](#-botu-başlatma-komut-açılışları)
- [Slash Komut Referansı](#-slash-komut-referansı-tam-liste)
- [Components V2 Panelleri](#-components-v2-panelleri)
- [Zamanlanmış Görevler (Scheduler)](#-zamanlanmış-görevler-scheduler)
- [Bilinen Sınırlamalar](#-bilinen-sınırlamalar-dürüstçe)
- [Sorun Giderme](#-sorun-giderme)
- [Test Durumu](#-test-durumu-dürüst-rapor)

---

## 🎮 Bu Bot Ne Yapar?

**WNERSDEV ULTIMATE STEAM BOT**, Discord sunucunu bir Steam kontrol merkezine dönüştürür.
Ayrı bir web paneli / dashboard **yoktur** — tüm yönetim, sorgu ve otomasyon Discord'un kendi
arayüzünden, **slash komutları** ve **Components V2** (buton/menü/panel) ile yapılır.

```mermaid
flowchart LR
    U["👤 Discord Kullanıcısı"] -->|"/steam ..."| B["🤖 wnersdev bot"]
    B --> S["🎮 Steam Web API"]
    B --> D[("🗄️ MongoDB")]
    B --> SC["⏰ Scheduler"]
    SC -->|"fiyat / başarım / haber"| N["🔔 Discord Bildirimleri"]
    B --> AI["🧠 AI Servisi (opsiyonel)"]
```

---

## ✨ Öne Çıkan Özellikler

| | |
|---|---|
| 🔗 **Hesap Bağlama** | Discord kullanıcısını Steam profiline bağla, tazele, kaldır |
| 🕹️ **Oyun Arama & Bilgi** | Mağazada anlık arama, oyun detayı, güncel fiyat sorgulama |
| 📈 **Fiyat Takibi** | Hedef fiyata inince otomatik bildirim |
| 🏆 **Başarım Takibi** | Oyun başarım ilerlemesini gösterir ve periyodik senkronize eder |
| 👥 **Arkadaş Durumu** | Herkese açık profillerde arkadaş / çevrim içi durumu listeler |
| 📰 **Haber Takibi** | Belirli oyunların haberlerini bir kanala otomatik düşürür |
| 🎁 **Çekiliş Sistemi** | Başlat / bitir / iptal / liste — tam otomatik zamanlayıcılı çekilişler |
| 🏅 **Leaderboard** | Başarım, takip ve çekiliş bazlı sunucu liderlik tabloları |
| 🧩 **Components V2 Panel** | `/panel` ile tek merkezden buton tabanlı gezinme |
| 🩺 **Sağlık Durumu** | `/status` ile bot, DB, Steam API, AI ve scheduler durumunu anlık gör |
| 💾 **Yedekleme** | Sunucu verilerini JSON olarak dışa/içe aktarma |
| 🧠 **Opsiyonel AI** | Yapılandırılırsa Anthropic Messages API destekli ek özellikler |
| 🛡️ **Dürüst Hata Yönetimi** | Veri yoksa/erişilemiyorsa **asla uydurma veri üretmez**, açıkça bildirir |

---

## 🏗️ Proje Mimarisi

```
wnersdev/
├── wnersdev.js              # 🚀 Ana giriş dosyası (client, login, scheduler start)
├── deploy-commands.js       # 📤 Slash komutlarını Discord'a kaydeden script
├── ayarlar.json             # ⚙️ Tek yapılandırma dosyası (doldurulması ZORUNLU)
├── package.json
├── .gitignore
│
├── commands/                # 🗂️ Slash komut tanımları
│   ├── steam.js             #   /steam (hesap, oyun, takip, başarım, arkadaşlar, haber, yedek...)
│   ├── cekilis.js           #   /cekilis (başlat, bitir, iptal, liste)
│   ├── status.js            #   /status
│   ├── panel.js             #   /panel
│   ├── yardim.js            #   /yardim
│   └── index.js             #   Komut koleksiyonu builder
│
├── handlers/                 # 🧠 Komut/panel iş mantığı (12 handler)
├── components/                # 🧩 Components V2 helper + interaction router
├── services/                  # 🔌 Steam API, AI, cache, queue, giveaway, leaderboard, backup, health...
├── scheduler/                  # ⏰ Fiyat/başarım/haber/çekiliş/arkadaş periyodik job'ları
├── database/                    # 🗄️ Mongoose bağlantısı + modeller
├── utils/                        # 🛠️ logger, id, duration, rateLimit, permissions
├── data/backups/                  # 💾 /steam yedek al ile oluşur (ilk çalıştırmada otomatik)
└── logs/                           # 📝 error.log, combined.log (token/secret ASLA loglanmaz)
```

> 🔍 **Kontrol edildi:** Zip içindeki tüm `.js` dosyaları `node --check` ile sözdizimi hatası
> içermediği doğrulanarak taranmıştır. `commands/steam.js` içindeki tüm alt komut/grup tanımları
> aşağıdaki komut tablosuyla birebir eşleşecek şekilde doğrulanmıştır. `data/backups/` ve `logs/`
> klasörleri zip içinde yoktur — bu normaldir, bot ilk çalıştığında kendisi oluşturur.

---

## 🚀 Kurulum (Adım Adım)

### 1️⃣ Bağımlılıkları yükle

```bash
npm install
```

Bu, `discord.js` (v14.16+) ve `mongoose` (v8.7+) paketlerini indirir.

### 2️⃣ `ayarlar.json` dosyasını doldur

Proje kökünde hazır bir `ayarlar.json` bulunur — örnek/demo dosya değildir, **tek config budur**.
Aşağıdaki bölümlerden token, ID ve API anahtarlarını alıp ilgili alanlara yapıştır.

### 3️⃣ Slash komutlarını Discord'a kaydet

```bash
npm run deploy
```

### 4️⃣ Botu başlat

```bash
npm start
```

✅ Terminalde `Bot giriş yaptı: ...` mesajını gördüysen bot çalışıyordur.

> ⚠️ `ayarlar.json` içinde zorunlu bir alan (discord.token, discord.clientId, mongodb.uri,
> steam.apiKey) placeholder/boş bırakılmışsa bot **hangi alanın eksik olduğunu açıkça söyleyip
> kapanır** — asla sessizce yarım çalışmaz.

---

## ⚙️ `ayarlar.json` Referansı

```json
{
  "discord": {
    "token": "DISCORD_BOT_TOKEN_BURAYA",
    "clientId": "DISCORD_CLIENT_ID_BURAYA",
    "guildId": "TEST_GUILD_ID_BURAYA",
    "globalCommands": false
  },
  "mongodb": {
    "uri": "MONGODB_URI_BURAYA"
  },
  "steam": {
    "apiKey": "STEAM_WEB_API_KEY_BURAYA"
  },
  "ai": {
    "enabled": false,
    "provider": "anthropic",
    "apiKey": "AI_API_KEY_BURAYA",
    "model": "claude-sonnet-4-6"
  },
  "scheduler": {
    "priceCheckIntervalMinutes": 60,
    "achievementCheckIntervalMinutes": 30,
    "friendStatusIntervalMinutes": 5,
    "newsCheckIntervalMinutes": 30,
    "giveawayCheckIntervalMinutes": 1
  },
  "cache": {
    "steamProfileTtlSeconds": 300,
    "steamAppTtlSeconds": 3600,
    "steamPriceTtlSeconds": 1800
  }
}
```

| Alan | Zorunlu mu? | Açıklama |
|---|:---:|---|
| `discord.token` | ✅ | Bot token'ı — **asla paylaşma / commit'leme** |
| `discord.clientId` | ✅ | Discord Application ID |
| `discord.guildId` | Test için önerilir | Boş bırakılırsa `globalCommands` mantığına göre davranır |
| `discord.globalCommands` | — | `false`: sadece `guildId` sunucusunda anında aktif · `true`: tüm sunucularda, ~1 saatte yayılır |
| `mongodb.uri` | ✅ | Mongo bağlantı dizesi |
| `steam.apiKey` | ✅ | Steam Web API anahtarı |
| `ai.enabled` | ❌ | `true` yapılmazsa AI özellikleri sessizce devre dışı kalır |
| `scheduler.*` | ❌ | Dakika cinsinden periyodik görev aralıkları |
| `cache.*` | ❌ | Saniye cinsinden Steam veri önbellek süreleri |

---

## 🌐 Discord Developer Portal Kurulumu

1. [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**
2. **Bot** sekmesi → bot oluştur → **Token**'ı kopyala → `ayarlar.json > discord.token`
3. **General Information** → **Application ID**'yi kopyala → `discord.clientId`
4. **Privileged Gateway Intent gerekmez** — Presence / Members / Message Content kapalı kalabilir,
   yalnızca varsayılan `Guilds` intent'i kullanılır.
5. **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Send Messages`, `Embed Links`, `Attach Files`, `Use External Emojis`, `Read Message History`
   - Oluşan linkle botu sunucuna davet et.
6. Test aşamasında `discord.guildId` alanına test sunucu ID'ni yaz, `globalCommands: false` bırak
   → komutlar anında aktif olur. Üretimde `globalCommands: true` yapılabilir.

---

## 🗄️ MongoDB Kurulumu

Herhangi bir MongoDB örneği kullanılabilir: yerel `mongod`, Docker, veya
[MongoDB Atlas](https://www.mongodb.com/atlas) ücretsiz katman.

```
mongodb+srv://kullanici:sifre@cluster0.mongodb.net/wnersdev
```

Bot ilk bağlandığında koleksiyon ve indeksleri Mongoose şemaları üzerinden **otomatik oluşturur** —
elle migration gerekmez.

---

## 🔑 Steam Web API Anahtarı

[steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey) adresinden ücretsiz anahtar al
→ `ayarlar.json > steam.apiKey`.

- **Anahtar olmadan çalışmaz:** hesap bağlama, profil, arkadaş, başarım (`ISteamUser` /
  `ISteamUserStats` uç noktaları). Anahtar yoksa bot net bir hata mesajı verir, **asla sahte veri
  üretmez**.
- **Anahtar gerektirmez:** mağaza arama, oyun detayı, fiyat bilgisi (`store.steampowered.com`
  storefront uç noktaları).

---

## ▶️ Botu Başlatma (Komut Açılışları)

Terminalde proje klasörünün içindeyken sırasıyla:

```bash
# 1. Bağımlılıkları kur (sadece ilk seferde / package.json değiştiğinde)
npm install

# 2. Slash komutlarını Discord'a kaydet (komut eklediğinde/değiştirdiğinde tekrar çalıştır)
npm run deploy
# → node deploy-commands.js dosyasını çalıştırır, ayarlar.json'daki
#   discord.clientId / guildId / globalCommands bilgisine göre komutları kaydeder.

# 3. Botu başlat
npm start
# → node wnersdev.js dosyasını çalıştırır:
#   loadConfig() → configureSteamApi() → configureAiService() → connectDatabase()
#   → Discord client login → 'ready' event'inde startScheduler() tetiklenir.
```

**Arkada neler oluyor? (`wnersdev.js` akışı)**

1. `ayarlar.json` okunur ve doğrulanır — eksik zorunlu alan varsa bot burada durur.
2. Steam API servisi ve (varsa) AI servisi yapılandırılır.
3. MongoDB'ye bağlanılır; bağlanamazsa bot **başlamadan** net bir hatayla kapanır.
4. Discord client oluşturulur, sadece `Guilds` intent'i ile.
5. `interactionCreate` event'i tüm slash komut ve buton/menü etkileşimlerini
   `handleInteractionCreate` üzerinden yönlendirir.
6. Bot login olup `ready` event'ine ulaştığında **scheduler** (fiyat/başarım/haber/çekiliş/arkadaş
   job'ları) otomatik başlar.
7. `SIGINT` / `SIGTERM` ile düzgün kapanış (`client.destroy()`), `unhandledRejection` /
   `uncaughtException` global olarak loglanır — **bot beklenmedik hatadan çökmez**.

Botu arka planda / sürekli açık tutmak istersen bir process manager kullanılabilir, örn.:

```bash
npm install -g pm2
pm2 start wnersdev.js --name wnersdev-bot
pm2 logs wnersdev-bot
```

---

## 📖 Slash Komut Referansı (Tam Liste)

### `/steam` — ana komut grubu

| Komut | Açıklama | Yetki |
|---|---|:---:|
| `/steam hesap bagla <steamid>` | Steam hesabını bağla (SteamID64 / vanity ad / profil linki) | Herkes |
| `/steam hesap kaldir` | Bağlantıyı kaldır | Herkes |
| `/steam hesap yenile` | Profil bilgisini tazele | Herkes |
| `/steam profil [kullanici]` | Steam profili göster | Herkes |
| `/steam oyun ara <isim>` | Mağazada oyun ara | Herkes |
| `/steam oyun bilgi <appid>` | Oyun detayı | Herkes |
| `/steam oyun fiyat <appid>` | Güncel fiyat | Herkes |
| `/steam takip ekle <appid> [fiyat] [basarim] [hedef-fiyat]` | Fiyat/başarım takibi ekle | Herkes |
| `/steam takip kaldir <appid>` | Takibi kaldır | Herkes |
| `/steam takip liste` | Takip listeni göster | Herkes |
| `/steam basarim goster <appid> [kullanici]` | Başarım ilerlemesi | Herkes |
| `/steam arkadaslar goster [kullanici]` | Arkadaş/durum listesi (ilk 10) | Herkes |
| `/steam haber ekle <appid> <kanal>` | Oyun haber takibi ekle | **Yönetici** |
| `/steam haber kaldir <appid>` | Haber takibini kaldır | **Yönetici** |
| `/steam haber liste` | Takip edilen haberleri listele | **Yönetici** |
| `/steam leaderboard [tur]` | Liderlik tablosu (başarım / takip / çekiliş) | Herkes |
| `/steam istatistik` | Sunucu istatistikleri | Herkes |
| `/steam ayarlar` | Kanal/rol ayarları paneli | **Yönetici** |
| `/steam senkronize` | Takip verilerini Steam ile eşitle | **Yönetici** |
| `/steam yedek al` | Sunucu verilerini JSON dışa aktar | **Yönetici** |
| `/steam yedek geri-yukle <dosya>` | JSON yedeği içe aktar | **Yönetici** |

### Diğer komutlar

| Komut | Açıklama | Yetki |
|---|---|:---:|
| `/cekilis baslat` | Yeni çekiliş başlat | **Yönetici** |
| `/cekilis bitir` | Çekilişi erken bitir | **Yönetici** |
| `/cekilis iptal` | Çekilişi iptal et | **Yönetici** |
| `/cekilis liste` | Aktif çekilişleri listele | Herkes |
| `/panel` | Components V2 ana menü | Herkes |
| `/status` | Bot / DB / Steam / AI / scheduler sağlık durumu | Herkes |
| `/yardim` | Komut listesi paneli | Herkes |

> 🛡️ **"Yönetici"** = Discord `Administrator` veya `Manage Guild` izni **ya da**
> `/steam ayarlar` panelinden atanan özel yönetici rolü.

---

## 🧩 Components V2 Panelleri

`/panel` komutu, tüm işlevlere buton ve menülerle erişilebilen tek bir merkezî panel açar.
İnteraktif her buton/menü tıklaması `handlers/interactionCreateHandler.js` üzerinden ilgili
handler'a (`panelHandler`, `settingsHandler`, `helpHandler`, vb.) yönlendirilir — ayrı bir web
arayüzü gerekmeden Discord içinde tam gezinme sağlar.

```mermaid
sequenceDiagram
    participant K as Kullanıcı
    participant D as Discord
    participant B as wnersdev bot
    K->>D: /panel
    D->>B: interactionCreate (chatInput)
    B->>B: panelHandler → Components V2 menüsü oluştur
    B-->>D: Butonlu panel mesajı
    K->>D: Bir butona tıkla
    D->>B: interactionCreate (button)
    B->>B: customId'ye göre ilgili handler'a yönlendir
    B-->>D: Güncellenmiş panel / sonuç
```

---

## ⏰ Zamanlanmış Görevler (Scheduler)

| Job | Varsayılan Aralık | Görev |
|---|---|---|
| `priceJob` | 60 dk | Takip edilen oyunların fiyatını kontrol eder, hedef fiyata inince bildirir |
| `achievementJob` | 30 dk | Kullanıcı başarımlarını Steam ile senkronize eder |
| `friendStatusJob` | 5 dk | Arkadaş/çevrim içi durumu günceller |
| `newsJob` | 30 dk | Takip edilen oyunların haberlerini kontrole gönderir |
| `giveawayJob` | 1 dk | Süresi dolan çekilişleri sonuçlandırır |

Tüm aralıklar `ayarlar.json > scheduler` altından dakika cinsinden değiştirilebilir.

---

## ⚠️ Bilinen Sınırlamalar (dürüstçe)

- **Steam hesap doğrulama seviyesi:** `/steam hesap bagla`, verilen SteamID/kullanıcı adının Steam'de
  **gerçekten var olduğunu** doğrular. Hesabın o Discord kullanıcısına **ait olduğunun kanıtlanması**
  (ownership) normalde Steam OpenID web akışı gerektirir; bu proje "dashboard/web sunucusu yok"
  ilkesiyle kurulduğu için ownership doğrulaması **yapılmaz** — bilinçli bir tasarım kararıdır.
- **Arkadaş durumu:** `GetFriendList` / `GetPlayerSummaries` sadece herkese açık profiller için veri
  döner; gizli profillerde bot bunu açıkça belirtir. API maliyetini sınırlamak için ilk 10 arkadaş
  örneklenir.
- **Leaderboard:** Yalnızca botun kendi veritabanında biriken gerçek verilerden hesaplanır (takip
  sayısı, senkronize edilen başarım sayısı, çekiliş kazançları) — tahmini/uydurma veri yoktur.

---

## 🧯 Sorun Giderme

| Belirti | Olası Neden | Çözüm |
|---|---|---|
| Bot açılışta hemen kapanıyor | `ayarlar.json`'da zorunlu alan boş/placeholder | Konsoldaki mesajda belirtilen alanı doldur |
| `MongoDB bağlantısı kurulamadı` | Hatalı URI / IP whitelist (Atlas) | `mongodb.uri`'yi kontrol et, Atlas'ta Network Access'e IP ekle |
| Komutlar Discord'da görünmüyor | `npm run deploy` çalıştırılmadı ya da global komutların yayılması bekleniyor | `npm run deploy` çalıştır; `globalCommands: true` ise ~1 saat bekle |
| Steam komutları hata veriyor | `steam.apiKey` boş/geçersiz | Yeni anahtar al, `ayarlar.json`'a yaz |
| AI özellikleri çalışmıyor | `ai.enabled: false` ya da `apiKey` boş | `ai.enabled: true` yap ve `ai.apiKey` doldur |
| Detaylı hata görmek istiyorum | — | `logs/error.log` ve `logs/combined.log` dosyalarına bak |

---

## 🧪 Test Durumu (dürüst rapor)

Bu proje, dış ağ erişimi kapalı bir ortamda geliştirildi/kontrol edildi. Bu nedenle:

- ✅ **Statik doğrulama yapıldı:** Zip içindeki her `.js` dosyası `node --check` ile sözdizimi
  hatası olmadan geçirildi.
- ✅ **Mantıksal gözden geçirme yapıldı:** Servisler arası veri akışı, hata kodları
  (`ok:false, reason:...`), yetki kontrolleri ve `customId` yönlendirmeleri elden geçirildi.
- ✅ **Komut tablosu koda karşı doğrulandı:** README'deki komut listesi, `commands/steam.js`
  içindeki gerçek `SlashCommandBuilder` tanımlarıyla birebir karşılaştırıldı.
- ❌ **Uçtan uca çalıştırılamadı:** `npm install`, gerçek bir Discord bot token'ı ile giriş, gerçek
  bir MongoDB bağlantısı, gerçek bir Steam Web API isteği — bunların hiçbiri bu ortamda test
  edilemedi çünkü dış ağ erişimi devre dışı.
- Bu yüzden "her komut sorunsuz çalışıyor" iddiasında bulunulmuyor. İlk gerçek çalıştırmada
  `npm start` çıktısını ve varsa `logs/error.log` dosyasını kontrol etmen önerilir.

---

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=0:66c0f4,50:2a475e,100:1b2838&height=140&section=footer)

### ⚡ Powered By WnersDev ⚡

<sub>Bu README, projenin gerçek kod tabanı (komutlar, handler'lar, scheduler, config) incelenerek
hazırlanmıştır — burada listelenen her komut ve akış zip içeriğiyle doğrulanmıştır.</sub>

</div>
