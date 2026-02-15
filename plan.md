# AttendanceProPlus — Geliştirme Planı

## 📋 Genel Bakış

AttendanceProPlus, üniversite öğrencilerinin ders devamsızlıklarını takip ettiği bir PWA. Tamamen client-side, veriler IndexedDB'de, PIN ile giriş, modern UI.

---

## 🏗️ Geliştirme Fazları

### Faz 0 — Proje Kurulumu
- [ ] Vite + Vanilla JS projesi oluştur
- [ ] Tailwind CSS'i Vite plugin olarak entegre et (PostCSS, build-time)
- [ ] shadcn/ui benzeri komponent sistemi kur
- [ ] `index.html` — temel HTML yapısı, Dexie.js CDN
- [ ] `src/main.js` — entry point
- [ ] `src/app.js` — hash-based router (`#/login`, `#/home`, `#/absence/add`, `#/schedule`, `#/stats`, `#/settings`)
- [ ] `public/manifest.json` — PWA manifest (uygulama adı, ikonlar, tema renkleri)
- [ ] `public/sw.js` — Service Worker (App Shell + Network First strateji)
- [ ] `src/db/database.js` — Dexie.js ile `courses` ve `absences` tabloları
- [ ] `src/store.js` — Basit reactive store (Observer pattern)

### Faz 1 — Kullanıcı Verisi ve Giriş
- [ ] Kullanıcıdan JSON ders verileri alınır
- [ ] `src/data/users.js` — hardcoded ders programları, `getScheduleForDay()` fonksiyonu
- [ ] `src/screens/PinLogin.js` — PIN oluşturma + giriş ekranı
  - İlk açılışta PIN + isim oluşturma
  - Sonraki açılışlarda PIN girişi (3 deneme, 30sn timeout)
  - Aktif session varsa bypass
  - localStorage'da hashed PIN

### Faz 2 — Ana Ekran (Home)
- [ ] `src/screens/Home.js`
  - Üst bar: kullanıcı adı, tarih, dark/light toggle
  - Özet kartı: toplam risk durumu
  - Bugünün dersleri: her biri CourseCard komponenti
  - Her derste **"Katılmadım"** butonu → onay dialog → anında kayıt
  - Devamsızlık limitleri girilmemişse uyarı banner: "⚠️ Devamsızlık yüzdelerini girin"
  - Mini takvim widget'ı (devamsızlık olan günler noktalı)
  - Alt navigasyon: Home, Program, İstatistik, Ayarlar
- [ ] `src/components/CourseCard.js` — ders kartı
- [ ] `src/components/ProgressBar.js` — limit doluluk çubuğu
- [ ] `src/components/AbsenceBadge.js` — devamsızlık göstergesi
- [ ] `src/components/MiniCalendar.js` — takvim widget
- [ ] `src/components/ThemeToggle.js` — dark/light geçiş
- [ ] Renk kodlaması: %0-50 yeşil, %51-80 sarı, %81-100 kırmızı (titreşim)

### Faz 3 — Devamsızlık Ekleme
- [ ] `src/screens/AddAbsence.js`
  - Home'dan "Katılmadım" → o dersin bugünkü saatini otomatik yükle → onay → kaydet
  - "Devamsızlık Ekle" butonu → **tüm dersler listelenir**
  - O gün ve ertesi günün dersleri en üstte (öncelikli sort)
  - Ders seçilince saat otomatik, kullanıcı değiştiremez
  - İsteğe bağlı not alanı
  - **"Geçmiş Devamsızlık Ekle"** butonu → date picker → seçilen güne göre dersler
  - Kayıt sonrası haptic feedback (`navigator.vibrate(50)`)
  - Başarı animasyonu → Home'a dön

### Faz 4 — Devamsızlık Yönetimi ve İstatistikler
- [ ] `src/screens/Stats.js`
  - Her ders için devamsızlık barı, toplam saat, kalan hak
  - En riskli ders üstte öne çıkarılmış
  - Dönem özeti
  - Kronolojik devamsızlık listesi (tarih, ders, saat, not)
  - **Swipe-to-delete** ile devamsızlık silme
  - Silme onay dialogu
  - Limite ulaşılınca haptic feedback (`navigator.vibrate([100, 50, 100])`)

### Faz 5 — Haftalık Program ve Takvim
- [ ] `src/screens/WeeklySchedule.js`
  - Haftalık tablo/grid görünümü
  - Her günün dersleri ve saatleri
  - Devamsızlık olan dersler işaretli (renk + ikon)
  - Mobil uyumlu yatay scroll

### Faz 6 — Ayarlar ve PWA Finalizasyonu
- [ ] `src/screens/Settings.js`
  - Dark/Light mode toggle
  - Ders bazında devamsızlık limiti düzenleme (yüzde veya saat)
  - **JSON dışa aktarma:** "Verileri Yedekle" → JSON dosyası indir
  - **JSON içe aktarma:** "Yedekten Geri Yükle" → JSON dosyası yükle
  - "Çıkış Yap" → PIN ekranına dön
  - Uygulama bilgisi: "Süleyman Aslım tarafından üretilen vibecoded uygulama. Açık kaynaklı."
- [ ] `src/components/InstallPrompt.js` — PWA install banner
  - Android: `beforeinstallprompt` event → özel install butonu
  - iOS: Adım adım rehber modal ("Paylaş → Ana Ekrana Ekle")
  - 3 girişte bir hatırlatma
- [ ] Her Cuma otomatik "Verilerini yedekle" hatırlatma bildirimi
- [ ] Service Worker finalizasyonu:
  - App Shell cache stratejisi
  - Versiyon güncellenince eski cache temizleme
  - Offline fallback sayfası

### Faz 7 — Error Handling, Polish ve Nice-to-Haves
- [ ] Error handling:
  - IndexedDB yazma hatası → retry mekanizması + localStorage fallback + kullanıcıya "Veri kaydedilemedi, tekrar deneyin" toast
  - Offline senaryoda CDN yüklenemezse → Service Worker cache'den servis
  - Tüm kritik işlemlerde try-catch + anlamlı hata mesajları
- [ ] Lazy loading: Tesseract.js gibi ağır kütüphaneler kaldırıldığı için sorun yok
- [ ] Performance: virtual scrolling için uzun listeler
- [ ] **(Nice-to-have, en son):** Bildirim sistemi
  - Web Notification API ile push bildirim
  - "X dersinde limite %80 yaklaştınız!" bildirimi
  - Ayarlardan açılıp kapatılabilir

---

## 🏛️ Mimari Kararlar

### Router
- Hash-based router: `#/login`, `#/home`, `#/absence/add?courseId=X&date=Y`
- `history.pushState` benzeri API
- "Geri" butonu desteği
- Parametre aktarımı query string ile

### State Management
- Basit reactive store (Observer pattern)
- Merkezi state → tüm screen'ler subscribe eder
- State değişince ilgili UI otomatik güncellenir

### Dönem Hesaplama
- Sabit **15 hafta** dönem
- `totalHours = hoursPerWeek × 15`
- Devamsızlık limiti bu toplama göre hesaplanır

### Tailwind CSS
- Vite plugin olarak entegre (PostCSS build pipeline)
- shadcn/ui benzeri komponent yapısı
- Dark/Light mode built-in

### Error Handling Stratejisi
- **IndexedDB yazma hatası:** 3 kez retry → başarısızsa localStorage'a geçici kaydet → sonraki açılışta sync
- **Veri bütünlüğü:** Her yazma işlemi sonrası doğrulama okuma
- **Kullanıcı bildirimi:** Toast notification sistemi (başarı, hata, uyarı)

---

## 📊 Yapılacaklar Öncelik Tablosu

| Öncelik | Konu | Faz |
|---------|------|-----|
| 🔴 P0 | Proje kurulumu + router + DB | Faz 0 |
| 🔴 P0 | PIN giriş sistemi | Faz 1 |
| 🔴 P0 | Home ekranı + "Katılmadım" | Faz 2 |
| 🔴 P0 | Devamsızlık ekleme (bugün + geçmiş) | Faz 3 |
| 🔴 P0 | Devamsızlık silme + Stats | Faz 4 |
| 🟡 P1 | Haftalık program görünümü | Faz 5 |
| 🟡 P1 | Ayarlar + yedekleme | Faz 6 |
| 🟡 P1 | PWA install prompt | Faz 6 |
| 🟡 P1 | Error handling + haptic | Faz 7 |
| 🟡 P1 | Mini takvim widget | Faz 2 |
| 🟢 P2 | Bildirim sistemi | Faz 7 (en son) |

---

## ✅ Sonraki Adım

1. **Kullanıcı JSON ders verilerini paylaşır** (iki kullanıcı için haftalık program)
2. `src/data/users.js` oluşturulur
3. Faz 0'dan başlayarak sırayla geliştirme yapılır

---

## 📝 Kaldırılan Özellikler (Scope-Out)
- ~~OCR ile ders tanıma~~ → Dersler JSON ile hardcoded girilecek
- ~~Ders ekleme/çıkarma UI~~ → Şu an sadece JS ile sabit veri
- ~~i18n (çoklu dil)~~ → Gerekli değil
- ~~Onboarding turu~~ → Gerekli değil
