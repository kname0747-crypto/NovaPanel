# SpeedSmm v3 — Kontrol Noktası (18 Ağustos 2026)

Bu dosya, `codedByCan/SpeedSmm_v3` reposu üzerinde yapılan inceleme ve düzeltmelerin
güncel durumunu tutar. Bir sonraki oturuma başlarken önce bu dosyayı oku.

> Kaynak repo: https://github.com/codedByCan/SpeedSmm_v3
> Geliştiricinin kendi notu: *"bu script yarıda bırakılmıştır"* — bu doğru, script
> gerçekten iskelet halinde ve birçok kritik parça (özellikle sipariş oluşturma)
> hiç yazılmamış.

---

## 1. Ortamı ayağa kaldırma

```bash
# 1) MongoDB (Docker container, kalıcı volume ile)
docker start speedsmm-mongo   # zaten oluşturulmuş container'ı başlatır
# ilk kurulumda: docker run -d --name speedsmm-mongo -p 27017:27017 -v speedsmm-mongo-data:/data/db mongo:6

# 2) Bağımlılıklar (bir kere)
npm install

# 3) Uygulama
node app.js
# → "NovaPanel Scripti 3000 portunda calisiyor."
```

> Not: Bu proje, public GitHub'da yayınlanırken **NovaPanel** olarak yeniden
> adlandırıldı; kaynak koddaki tanıtım linkleri (Discord, sponsor, iletişim vb.)
> kaldırıldı. Orijinal esere atıf `LICENSE.md` ve `README.md`'de (CC BY-NC-SA 4.0
> gereği) korunuyor.

- `config.js` içinde `port: 3000` (orijinali `80` idi, root yetkisi istemesin diye değiştirildi).
- Loglar bu oturumda `/private/tmp/.../scratchpad/app.log`'a yönlendirildi — kalıcı
  değil, yeni oturumda `node app.js` çıktısını yeniden bir dosyaya yönlendir.

### Test kimlik bilgileri
Yerel test için bir admin kullanıcı oluşturulup MongoDB'de elle `role: admin` ve
`verified: true` set edildi (gerçek mail/SMS akışı test edilmedi). Kimlik bilgileri
bu dosyada tutulmuyor — yeni bir oturumda gerekirse yerel DB'de tekrar oluştur.

### Örnek katalog verisi (test için eklendi)
- Platform: **Instagram** (id 1)
- Kategori: **Takipçi** (id 1, platform 1)
- Servis: **Instagram Türk Takipçi** (id 1, category 1, price 50, min 100, max 10000, refill: true)

---

## 2. Bu oturumda yapılan düzeltmeler

### 🔴 Kritik / uygulamayı çökerten hatalar (düzeltildi)
1. **`crypto.randomBytes is not a function`** — `app.js:7`. Node 19+'ta global
   `crypto` salt-okunur bir getter (Web Crypto API); eski `global.crypto =
   require('crypto')` ataması sessizce başarısız oluyordu. `Object.defineProperty`
   ile düzeltildi. **Her register isteğinde sunucuyu çökertiyordu.**
2. **`ReferenceError: Cannot access 'user' before initialization`** —
   `routers/api/api.js`, register endpoint'i. Hem log kaydında (`userID: user._id`)
   hem referral bloğunda, henüz tanımlanmamış `user` değişkenine (TDZ) erişiliyordu.
   `_id`'yi `new mongoose.Types.ObjectId()` ile önceden üretip kullanacak şekilde
   düzeltildi. **Referral modülü açıkken her register isteğini çökertiyordu.**
3. **`/` anasayfa sabotajı** — `routers/client/index.js`. Kök route kasıtlı olarak
   "bu sürüm artık desteklenmiyor, speedsmm.com v5'e geç" reklamına sabitlenmişti
   (geliştirici ücretsiz v3'ü ticari v5'e trafik yönlendirmek için kilitlemiş).
   Gerçek davranışa döndürüldü: giriş yapılmamışsa `/auth/login`'e, yapılmışsa
   `/new_order`'a yönlendiriyor.

### 🟡 Sessiz veri/mantık hataları (düzeltildi)
4. **`services.ejs` hiç yoktu** → `/services` sayfası her zaman 500 veriyordu.
   Sıfırdan yazıldı (bkz. Bölüm 4).
5. **`/api/v1/platforms/get/:id` tamamen bozuktu** — `routers/api/api.js`. Yanlış
   koleksiyonu sorguluyordu (`platformModel.findOne` yerine kategori listesi
   dönmesi gerekiyordu) ve var olmayan bir alanı filtreliyordu (`status`, oysa
   şemada alan adı `visible`). Sonuç: bu endpoint **hiçbir zaman** veri
   döndürmüyordu. Artık `categoryModel.find({ platform: id, visible: true })`
   sorguluyor ve kategori dizisi döndürüyor.
6. **`category` şemasında `platform` alanı yoktu** — `database/category.js`.
   Platform → Kategori ilişkisi veri modelinde hiç kurulmamıştı (madde 5'in kök
   nedeni). `platform: { type: Number, required: true }` eklendi.
7. **`/new_order` sayfasında kategori/servis dropdown çakışması** —
   `www/client/pages/index.ejs`. `#newOrderCategory` ve `#newOrderService` aynı
   CSS class'ını (`js-example-basic-single`) paylaşıyordu, bu yüzden servis
   seçilince kategori handler'ı tetikleniyor, fiyat/min/max hiç dolmuyordu.
   Servis select'i `js-example-basic-single2` class'ına alındı (JS zaten bunu
   bekliyordu).
8. **Fiyat inputu `.innerHTML` ile set ediliyordu** — `www/client/assets/panel/
   newOrder.js` (+ kullanılmayan `www/admin/assets/panel/newOrder.js` kopyası).
   `#newOrderPrice` bir `<input>`, `.value` ile set edilecek şekilde düzeltildi.
   `#newOrderMin`/`#newOrderMax` gösterge elemanları `index.ejs`'e eklendi (JS
   zaten onları arıyordu, DOM'da yoktu).
9. **`/api/v1/services/get/:category`** yanıtına eksik olan `type` ve `refill`
   alanları eklendi (şemada var, response map'inde unutulmuştu).

### 🟢 Sıfırdan eklenen özellikler
10. **`/services` sayfası** (`www/client/pages/services.ejs` +
    `www/client/assets/panel/services.js`) — Platform → Kategori seçince o
    kategorideki servisleri (ID, isim, min, max, fiyat, tip, refill) tablo
    halinde listeler. `/new_order` ile aynı mimariyi (aynı API endpoint'lerini)
    kullanır. i18n anahtarları `languages/tr.json` ve `en.json`'a eklendi
    (`services.page.*`).
11. **Admin katalog yönetimi** (`/admin/services`, `www/admin/pages/services.ejs`,
    `routers/admin/index.js`) — Sidebar'da zaten "Servisler" linki vardı ama route
    hiç yoktu (404). Şimdi: Platform / Kategori / Servis ekleme formları + listeleme
    tabloları + silme (cascade: platform silinince altındaki kategoriler ve
    servisler de silinir, kategori silinince altındaki servisler de silinir).
    **Bu, panelde platform/kategori/servis eklemek için var olan TEK arayüz** —
    başka hiçbir CRUD yoktu.

---

## 3. Şu anda GERÇEKTEN çalıştığı doğrulanmış özellikler

Test edildi (curl + gerçek DB kaydı ile), çalışıyor:

- [x] Kayıt ol (`POST /api/v1/auth/register`)
- [x] Giriş yap (`POST /api/v1/auth/login`)
- [x] `/` → giriş durumuna göre doğru yönlendirme
- [x] `/new_order` sayfası açılıyor, platform→kategori→servis dropdown zinciri
      artık gerçekten dolduruyor (min/max/fiyat dahil)
- [x] `/services` sayfası açılıyor, platform→kategori seçince servis tablosu doluyor
- [x] `/admin` → `/admin/users` (kullanıcı listesi, salt okunur)
- [x] `/admin/services` — platform/kategori/servis ekleme ve silme
- [x] `/orders`, `/account`, `/api`, `/child_panels`, `/refill`, `/balance_load`,
      `/support`, `/invite`, `/terms` sayfaları açılıyor (checkAuth ile korunuyor) —
      **ama içerikleri (gerçek veri akışları) tek tek test edilmedi**, sadece
      sayfa render hatası vermediği doğrulandı.

---

## 4. 🚨 En kritik eksik: Sipariş oluşturma akışı hiç yok

Bu, bir sonraki geliştirme oturumunda **ilk öncelik** olmalı. Panelin asıl işlevi
("yeni sipariş ver") API katmanında **hiç mevcut değil**:

- `www/client/pages/index.ejs`'teki `#signupForm` / `#newOrderButton`'ın hiçbir
  submit handler'ı yok (`newOrder.js` içinde `$("#signupForm").on("submit", ...)`
  gibi bir şey yok). Butona basınca hiçbir şey olmuyor (ya da tarayıcı formu normal
  GET olarak submit edip sayfayı sıfırlıyor).
- `routers/api/api.js`'de sipariş oluşturan **hiçbir POST route yok**
  (`grep -rn "new orderModel" routers/ plugins/ functions/ cron/` → sonuç boş).
- `database/order.js` şeması hazır (url, quantity, price, service bilgisi vb.)
  ama onu dolduran hiçbir kod yok.
- Bakiye düşme, servis min/max doğrulaması, provider'a (tedarikçi API'sine)
  sipariş iletme — hiçbiri yok.

**Yapılması gereken:** `POST /api/v1/order/create` gibi bir endpoint + frontend'de
gerçek submit handler. Bakiyeden düşme, min/max kontrolü, `orderModel` kaydı ve
(gerçek tedarikçi entegrasyonu yoksa) en azından "pending" durumunda sipariş
oluşturma akışı kurulmalı.

---

## 5. Bilinen ama henüz DOKUNULMAMIŞ diğer sorunlar

Bunlar keşfedildi ama bu oturumda düzeltilmedi — bir sonraki tur için liste:

| # | Sorun | Konum | Etki |
|---|---|---|---|
| 1 | `/admin/settings` sidebar'da link var, route yok → 404 | `www/admin/partials/_sidebar.ejs` / `routers/admin/index.js` | Site ayarları admin'den değiştirilemiyor |
| 2 | Admin panelde kullanıcı ekleme/ban/bakiye düzenleme modalları **dekoratif** — hiçbir submit/fetch bağlı değil | `www/admin/pages/index.ejs` (addUserModal, sendNotificationModal) | Admin kullanıcı yönetemiyor (sadece görüntülüyor) |
| 3 | Döviz kuru pluginı ölü bir adrese bağlanmaya çalışıyor: `fastexchangerateapi.fevehex882.repl.co` → `ENOTFOUND` | `plugins/fastexchange.js`, cron | Kur güncellemesi hiç çalışmıyor, cron her seferinde hata basıyor |
| 4 | `payTR` (sanal pos) entegrasyonu hiç test edilmedi | `plugins/pay/paytr.js` | Bakiye yükleme gerçek ödeme ile denenmedi |
| 5 | Mail/SMS doğrulama akışları (sendMail, netGsm, bizimSms, iletiMerkezi) gerçek kimlik bilgileriyle test edilmedi | `plugins/` | Kayıt sonrası doğrulama akışı bilinmiyor |
| 6 | Lisans çelişkisi: `package.json` → MIT, `README.md`/`LICENSE.md` → CC BY-NC-SA 4.0 (ticari kullanım yasak) | repo kökü | Ticari kullanımdan önce netleştirilmeli |
| 7 | `others.js` her sayfada `getElementById('themeChange')` arıyor, o eleman olmayan sayfalarda konsola hata basıyor | `www/client/assets/panel/others.js:1` | Kozmetik, işlevi bozmuyor |
| 8 | `en.json` çok eksik (~150 anahtar, bazıları placeholder — değer olarak anahtarın kendisi yazılmış), `tr.json` ~250 anahtar | `languages/en.json` | İngilizce dil desteği gerçek değil |
| 9 | `www/admin/assets/panel/newOrder.js` ve `www/admin/pages/` altında karşılığı olmayan bazı asset'ler — ölü kod, temizlenebilir | `www/admin/assets/panel/newOrder.js` | Zararsız ama kafa karıştırıcı |
| 10 | Child panel (alt bayilik) satın alma akışı hiç incelenmedi | `routers/admin/index.js` (`/child_panels`, salt okunur), `database/childpanel.js` | Bilinmiyor |

---

## 6. Veri modeli ilişkileri (güncel — bu oturumda kuruldu)

```
platformModel (platforms)
  id, queue, name, visible
        │
        │ 1—N  (category.platform → platform.id)   ← BU OTURUMDA EKLENDİ
        ▼
categoryModel (category)
  id, platform, queue, name, visible, role, description
        │
        │ 1—N  (service.category → category.id)     ← zaten vardı, çalışıyordu
        ▼
serviceModel (service)
  id, name, category, price, min, max, type, refill,
  service: { apiID, serviceID, amount }   ← gerçek tedarikçi entegrasyonu yok,
                                             admin formundan "manual" dolduruluyor
        │
        │ (henüz hiçbir kod tarafından kullanılmıyor — bkz. Bölüm 4)
        ▼
orderModel (order)  ← şema hazır, oluşturan kod YOK
```

---

## 7. Sıradaki oturum için kontrol listesi

1. **Öncelik #1**: Sipariş oluşturma API'sini ve formunu inşa et (Bölüm 4).
2. `/admin/settings` sayfasını (site adı, para birimi, entegrasyon anahtarları vb.)
   inşa et — şu an admin hiçbir global ayarı değiştiremiyor.
3. Admin kullanıcı yönetimini gerçek hale getir (ban/unban, bakiye düzenleme,
   rol değiştirme) — modallar zaten UI'da duruyor, sadece backend'e bağlanmamış.
4. `refill`, `support`, `balance_load`, `child_panels` sayfalarının **gerçek veri
   akışlarını** (sadece render değil, buton/form işlevlerini) tek tek test et.
5. Ölü döviz kuru API'sini ya kaldır ya da gerçek bir kaynakla (örn. exchangerate
   API) değiştir.
6. Lisans çelişkisini netleştir (ticari kullanım planlanıyorsa özellikle önemli).
7. Gerçek bir tedarikçi API entegrasyonu (ya da en azından "manual fulfillment"
   admin akışı) tasarla — şu an servisler tamamen elle admin panelinden giriliyor,
   otomatik senkronizasyon yok.

---

## 8. Hızlı dosya haritası

| Alan | Route dosyası | View'lar | Client JS |
|---|---|---|---|
| Auth | `routers/client/auth.js`, `routers/api/api.js` (`/auth/*`) | `www/client/pages/auth/*.ejs` | `www/client/assets/panel/auth.js` |
| Yeni Sipariş | `routers/client/index.js` (`/new_order`) | `www/client/pages/index.ejs` | `www/client/assets/panel/newOrder.js` |
| Servisler (yeni) | `routers/client/index.js` (`/services`) | `www/client/pages/services.ejs` | `www/client/assets/panel/services.js` |
| Siparişlerim | `routers/client/index.js` (`/orders`) | `www/client/pages/orders.ejs` | `www/client/assets/panel/orders.js` |
| Admin Katalog (yeni) | `routers/admin/index.js` (`/admin/services`) | `www/admin/pages/services.ejs` | — (plain form POST) |
| Admin Kullanıcılar | `routers/admin/index.js` (`/admin/users`) | `www/admin/pages/index.ejs` | `www/admin/assets/panel/users.js` |
| Ana middleware | `functions/middleware.js` (`checkAuth`, `checkAdmin`) | — | — |
| Şemalar | `database/*.js` | — | — |
