# NovaPanel

SMM Panel Scripti / SMM Panel Script

Bu depo, FastUptime tarafından yazılan **SpeedSmm v3** kaynak kodunun türetilmiş
(adapted) bir sürümüdür; orijinal script yarım bırakılmış şekilde paylaşılmıştı ve
bu depoda üzerinde onarım/geliştirme çalışması yapılmaktadır.
This repository is an adapted version of **SpeedSmm v3**, originally written by
FastUptime and shared as an unfinished/half-built script; it is under active
repair and development here.

# 🪄 Some Features 🪄

- Multi-language support
- Multi-Currency support
- Light Dark Theme
- Personalise pages as you like
- Sending balances to users
- Coupon System
- Child Panel System
- Detailed log system
- Advanced plugin system
- Same API network as other smmpanels
- And hundreds of other features

# 🚀 Yerel Kurulum ve Test (macOS / Linux / Windows)

## 1. Ön gereksinimler

- **Node.js 18+** (Node 19+'ta `crypto` global'i için özel bir düzeltme mevcut, bkz. `app.js`)
- **MongoDB** (yerel kurulum ya da Docker)
- `git`

## 2. Depoyu al ve bağımlılıkları kur

```bash
git clone https://github.com/kname0747-crypto/NovaPanel.git
cd NovaPanel
npm install
```

## 3. MongoDB'yi ayağa kaldır

### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```
Docker tercih edersen (macOS/Linux/Windows ortak):
```bash
docker run -d --name novapanel-mongo -p 27017:27017 -v novapanel-mongo-data:/data/db mongo:6
```

### Linux (Debian/Ubuntu)
```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod
```
veya Docker ile (yukarıdaki `docker run` komutu aynen çalışır).

### Windows
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) kurulum sihirbazıyla kur ve "MongoDB" servisini başlat, **veya**
- Docker Desktop kuruluysa PowerShell/CMD'de yukarıdaki `docker run` komutunu çalıştır.
- WSL2 kullanıyorsan Linux adımlarını izleyebilirsin.

MongoDB varsayılan olarak `localhost:27017`'de dinler; `config.js`'teki `mongoDB` adresi buna göre ayarlıdır.

## 4. Uygulamayı çalıştır

```bash
node app.js
# veya
npm start
```
Konsolda `NovaPanel Scripti 3000 portunda calisiyor.` mesajını gördüysen tarayıcıdan
`http://localhost:3000` adresine gidebilirsin. İlk çalıştırmada `siteModel` boşsa
varsayılan site verisi otomatik oluşturulur (bkz. `app.js`).

## 5. Admin hesabı oluşturma

Şu an panelde admin atama/onboarding arayüzü yok (bkz. `CHECKPOINT.md` §5). Önce
normal kayıt akışıyla (`/auth/register`) bir kullanıcı oluştur, sonra MongoDB'de
elle admin yap:

```bash
# mongosh ile (macOS/Linux/Windows hepsinde aynı komut)
mongosh novapanel --eval '
  db.users.updateOne(
    { username: "KULLANICI_ADIN" },
    { $set: { role: "admin", verified: true } }
  )
'
```
Ardından `/admin` yoluna aynı kullanıcı ile giriş yapabilirsin.

## 6. Test verisi (platform / kategori / servis)

Sipariş dropdown'larının dolması için `/admin/services` sayfasından en az bir
platform, bir kategori ve bir servis eklemen gerekir (aksi halde `/new_order` ve
`/services` sayfaları boş görünür).

---

# 🔧 Nelerin Değiştirilebileceği

| Ne | Nerede | Not |
|---|---|---|
| Port, MongoDB adresi, site URL | `config.js` | Kurulumdan önce ayarla |
| Şifreleme salt değerleri (`salt.one`, `salt.two`) | `config.js` | **İlk kurulumdan sonra asla değiştirme** — mevcut kullanıcı şifreleri geçersiz olur |
| Lisans anahtarı | `config.js` → `licenseKey` | Kendi değerinle değiştir |
| Dil metinleri (TR/EN) | `languages/tr.json`, `languages/en.json` | Yeni dil eklemek için `languages/` altına `xx.json` eklemek yeterli — `app.js` diller dizinini otomatik tarar |
| Site adı, SEO, mail şablonu, kullanım koşulları, döviz kurları gibi varsayılanlar | `database/site.js` (şema `default` değerleri) | İlk kurulumda DB'ye bir kere yazılır; sonrasında değiştirmek için doğrudan `siteModel` kaydını güncellemek gerekir (admin panelde henüz genel ayarlar sayfası yok) |
| Platform / Kategori / Servis kataloğu | `/admin/services` (panel içi) | Tek gerçek CRUD arayüzü burası |
| Mail / SMS / ödeme sağlayıcı entegrasyonları | `plugins/` (`sendMail.js`, `plugins/sms/*`, `plugins/pay/paytr.js`, `plugins/fastCrypto.js`) | Her plugin kendi API anahtarlarını `siteModel`/plugin dosyası üzerinden bekler; gerçek kimlik bilgileriyle test edilmedi (bkz. `CHECKPOINT.md`) |
| Döviz kuru API'si | `plugins/fastexchange.js` | Örnekteki adres placeholder'dır, kendi kur API'nizi girmelisiniz |
| Aktif eklentiler listesi | `app.js` → `plugins` dizisi | Bir plugin'in yüklenmesi için hem burada listeli olmalı hem de dosyanın `module.exports.name` alanı bu isimle eşleşmeli |

# 🎯 License 🎯

- ⚖️ Protected by Creative Commons ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)) — **NonCommercial use only**, and any distribution (including modified versions) must remain under this same license, with attribution to the original author preserved (see `LICENSE.md`).
- Original work: SpeedSmm v3 © FastUptime, licensed under CC BY-NC-SA 4.0.

<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" title="BYNCSA40"><img src="https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png"></a>
