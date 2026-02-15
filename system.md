# AttendanceProPlus — Sistem Dokümantasyonu

## 🎯 Uygulama Nedir?

**AttendanceProPlus**, üniversite öğrencilerinin ders devamsızlıklarını takip etmelerine yardımcı olan bir **Progressive Web App (PWA)**'dır. Uygulama tamamen istemci tarafında çalışır; hiçbir veri sunucuya gönderilmez. Tüm veriler cihazın yerel veritabanında (IndexedDB) saklanır.

### PWA Kurulumu
Uygulama ilk açıldığında kullanıcıya **özel bir install banner** gösterilir:
- **iOS Safari:** Adım adım rehber — "Paylaş ikon → Ana Ekrana Ekle" görselli prompt
- Kullanıcı "Şimdi Değil" derse, her 3 girişte bir tekrar hatırlatılır
- Kurulunca native uygulama gibi açılır, internet bağlantısı olmadan çalışır

---

## 🧑‍🎓 Kullanıcı Sistemi

Her kullanıcının **kendi cihazı** vardır. İlk açılışta kullanıcı **4 haneli PIN kodu** belirler. Bu PIN cihazda `localStorage`'da hashed olarak saklanır. Bir kez giriş yapıldığında session aktif kalır, tekrar PIN girilmesi gerekmez (cihaz değişmedikçe veya çıkış yapılmadıkça).

**Giriş akışı:**
1. İlk açılış → "Hoş geldin! 4 haneli PIN'ini oluştur"
2. PIN oluşturulduktan sonra kullanıcı adı girişi
3. Sonraki açılışlarda: Eğer aktif session varsa → direkt Home'a
4. Session yoksa → PIN giriş ekranı (3 deneme hakkı, sonra 30sn bekleme)
5. Settings'ten "Çıkış Yap" ile session sonlandırılabilir

> **Not:** Aynı cihazda iki kullanıcı yoktur. Her kullanıcı kendi telefonunda kendi hesabıyla kullanır.

---

## 🧩 Temel Özellikler

### 1. Ana Ekran (Home)
- Bugün hangi gün → o güne ait dersler listelenir
- Her ders kartında: ders adı, saat sayısı, devamsızlık durumu
- Her dersin yanında **"Katılmadım"** butonu → tıklanınca o dersi anında devamsızlık olarak kaydeder (onay dialog ile)
- Renk kodlaması ile risk durumu görsel olarak belirtilir:
  - 🟢 **Yeşil** — %0-50 (güvenli)
  - 🟡 **Sarı** — %51-80 (dikkat)
  - 🔴 **Kırmızı** — %81-100 (kritik, titreşim animasyonu)
- Üstte devamsızlık özet kartı
- **Mini takvim widget'ı** — devamsızlık olan günler işaretli, güne tıklayınca detay
- Devamsızlık limitleri girilmemişse küçük bir uyarı: "⚠️ Derslerinizin devamsızlık yüzdelerini girin"

### 2. Devamsızlık Ekleme
**Hızlı ekleme (Home'dan):**
- "Katılmadım" butonuna basılır → o dersin bugünkü saat sayısı otomatik yüklenir → onay → kayıt

**Detaylı ekleme (Devamsızlık Ekle butonundan):**
- **Tüm dersler** listelenir
- **O gün ve ertesi günün dersleri** en üstte gösterilir (öncelikli sıralama)
- Ders seçilince saat sayısı otomatik gelir
- İsteğe bağlı not alanı
- Onay sonrası IndexedDB'ye kaydedilir
- **📳 Haptic feedback** — kayıt sonrası kısa titreşim

**Geçmiş devamsızlık ekleme:**
- "Geçmiş Devamsızlık Ekle" butonu
- Tarih seçici (date picker) açılır
- Seçilen tarihe göre o günün schedule'ındaki dersler listelenir (Pazartesi → Pazartesi dersleri)
- Ders seçilip kaydedilir

### 3. Devamsızlık Yönetimi
- Tüm devamsızlıklar kronolojik listede görüntülenebilir
- Her kayıtta **Sil** aksiyonu (onay dialog ile)
- Stats ekranında **swipe-to-delete** desteği
- Silme işleminde haptic feedback

### 4. İstatistikler (Stats)
- Her ders için devamsızlık özet kartı
- Toplam devamsız saat / toplam ders saati
- Yüzde doluluk barı
- "X saat hakkın kaldı" veya "LİMİT DOLDU ⚠️"
- En riskli ders öne çıkarılır
- Kronolojik devamsızlık listesi (tarih, ders, saat, not) — swipe-to-delete ile

### 5. Haftalık Ders Programı
- Haftalık tablo/grid görünümünde tüm dersler
- Her günün dersleri, saatleriyle birlikte
- Devamsızlık olan dersler işaretli görünür

### 6. Ayarlar (Settings)
- Dark / Light mod geçişi
- Ders bazında devamsızlık limiti düzenleme (yüzde veya saat)
- Veri yedekleme: JSON olarak dışa aktarma / içe aktarma
- Kullanıcı çıkışı (PIN ekranına dönüş)
- Uygulama bilgisi: "Süleyman Aslım tarafından üretilen vibecoded uygulamadır. Açık kaynaklı."

---

## 🛠️ Teknik Mimari

### Stack
| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| UI Framework | Vanilla JavaScript | Framework bağımlılığı yok |
| Stil | Tailwind CSS + shadcn/ui | Modern komponentler, dark/light mode |
| Veritabanı | IndexedDB (Dexie.js) | Offline, kalıcı yerel depolama |
| Build | Vite | Hızlı geliştirme sunucusu |
| PWA | Service Worker + Manifest | Offline çalışma, kurulabilirlik |

### Veri Akışı

```
Kullanıcı → PIN Login → Home (schedule'dan bugünün dersleri)
                              ↓
                    "Katılmadım" veya "Devamsızlık Ekle"
                              ↓
                         IndexedDB (absences tablosu)
                              ↓
                         Stats (okuma → görselleştirme)
```

### Veritabanı Şeması

#### `courses` Tablosu
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | string | Otomatik üretilir |
| userId | string | Kullanıcı ID'si |
| name | string | Ders adı |
| hoursPerWeek | number | Haftalık saat |
| absenceLimit | object | {type: "percent"\|"hours", value: number} |
| totalHours | number | hoursPerWeek × 15 (dönem = 15 hafta) |
| color | string | UI rengi |

#### `absences` Tablosu
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | string | Otomatik üretilir |
| userId | string | Kullanıcı ID'si |
| courseId | string | İlgili ders ID'si |
| date | string | "YYYY-MM-DD" formatı |
| hours | number | Devamsız saat sayısı |
| note | string \| null | Opsiyonel not |

### Ekran Yapısı

```
PIN Login ─→ Home ──→ Devamsızlık Ekle (bugün)
                 │  └→ Geçmiş Devamsızlık Ekle
                 ├──→ Haftalık Program
                 ├──→ Stats (devamsızlık listesi)
                 └──→ Settings
```

### Dönem Hesaplama
- Dönem = **15 hafta** (sabit)
- `totalHours = hoursPerWeek × 15`
- Devamsızlık limiti bu toplama göre hesaplanır

### PWA Özellikleri
- **Offline çalışma:** Service Worker tüm uygulama dosyalarını cache'ler
- **Ana ekrana kurulma:** Özel install prompt + rehber
- **Yedekleme hatırlatması:** Her Cuma günü "Verilerini yedekle" bildirimi

---

## 🔒 Gizlilik ve Güvenlik

- **Sıfır sunucu iletişimi** — hiçbir veri dışarı gitmez
- **Tamamen yerel depolama** — IndexedDB cihazda kalır
- **PIN korumalı** — cihaz paylaşılsa bile veriler korunur
- **Veri yedekleme** — JSON olarak dışa aktarılabilir

---

## 📱 Desteklenen Platformlar

| Platform | Durum |
|----------|-------|
| iOS Safari (PWA) | ✅ Tam destek |
| Android Chrome (PWA) | ✅ Tam destek |
| Desktop Chrome/Firefox | ✅ Tam destek |
| Samsung Internet | ✅ Tam destek |

---

## 📂 Proje Dosya Yapısı

```
attendance-proplus/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
│       └── logo.png
├── src/
│   ├── main.js
│   ├── app.js
│   ├── style.css
│   ├── data/
│   │   └── users.js
│   ├── db/
│   │   └── database.js
│   ├── screens/
│   │   ├── PinLogin.js
│   │   ├── Home.js
│   │   ├── AddAbsence.js
│   │   ├── WeeklySchedule.js
│   │   ├── Stats.js
│   │   └── Settings.js
│   └── components/
│       ├── CourseCard.js
│       ├── AbsenceBadge.js
│       ├── ProgressBar.js
│       ├── MiniCalendar.js
│       ├── InstallPrompt.js
│       └── ThemeToggle.js
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔄 Versiyon

- **v1.0** — İlk sürüm (geliştirme aşamasında)
- Geliştirici: Süleyman Aslım
- Lisans: Açık kaynak
