# blogüret - Çok Şirketli (Multi-Tenant) Yapay Zeka İçerik Otomasyonu Platformu

**blogüret**, birden fazla şirketin aynı yapay zeka otomasyon iş akışını kullanarak, tamamen kendilerine ait marka profilleri, anahtar kelimeleri ve kaynaklarıyla blog yazısı üretebildiği modern bir SaaS platformudur.

---

## 🌟 Temel Özellikler ve Mimari Prensipler

1. **Katı Şirket İzolasyonu (Multi-Tenant Isolation):**
   - Her şirketin marka profili, kaynak havuzu, anahtar kelimeleri ve üretilen içerikleri diğer şirketlerden tamamen izoledir.
   - Bir şirketin editörü veya yöneticisi, diğer şirketin verilerine erişemez; arayüzde yetkisi olmayan şirketler listelenmez.

2. **Ortak n8n İş Akışı:**
   - Şirketlere özel workflow kopyaları oluşturulmaz. Ortak n8n iş akışı, ilgili şirketin parametrelerini sunucu tarafından güvenli bir şekilde alarak çalışır.

3. **Süper Admin & Kayıt Onay Mekanizması:**
   - Yeni kayıt olan kullanıcının hesabı "Beklemede" (Pending) statüsünde başlar.
   - Süper Admin onaylamadan kullanıcı şirket paneline veya verilerine kesinlikle erişemez.
   - Süper admin yetkisi kullanıcı metadatası içinde değil, korumalı `platform_admins` tablosunda tutulur.
   - Tüm kritik yönetici işlemleri `audit_logs` tablosuna kaydedilir.

4. **Kullanıcı Arayüzü Tasarımı:**
   - Koyu lacivert sol menü (`#0B132B`), dalga logolu `blogüret` simgesi, açık gri zemin (`#F8FAFC`).
   - 4 adımlı yatay süreç çubuğu (*Kaynak onayı → Yazı planı → Final onayı → Tamamlandı*).
   - Tamamlanan blog yazısı için 2 sütunlu detay görünümü, `[S1]`, `[S2]` kaynak atıfları, SEO bilgileri ve Markdown dışa aktarma.

5. **Deterministik Marka Profili Ayrıştırıcı:**
   - Yüklenen veya yapıştırılan `.md` belgelerini ayrıştırır; 512 KB sınırını ve zararlı HTML/script içeriklerini engeller.
   - Yeni yüklenen profiller önce **Taslak** olarak kaydedilir, kullanıcının açık onayı ile yeni sürüm (v2, v3) olarak yayına alınır.

6. **Manuel Tarama ve Çift Tetikleme Koruması:**
   - Anahtar kelime eklemek otomatik taramayı başlatmaz.
   - Tarama yalnızca "Kaynak Taramasını Başlat" butonuna basıldığında tetiklenir ve idempotency anahtarıyla çift tetikleme engellenir.

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+ veya 20+
- npm veya yarn

### 1. Bağımlılıkları Kurun
```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarlayın
Demo modunda çalışmak için herhangi bir harici servise gerek yoktur:
```bash
cp .env.example .env.local
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:3000` (veya boşta olan port) adresinde açılır.

---

## 🧪 İş Mantığı Testlerini Çalıştırma

Sistemdeki şirket ayrımı, bekleyen başvuru kilidi, çift tetikleme koruması, marka profili güvenlik parser'ı ve Zod n8n kontratı testlerini çalıştırmak için:

```bash
npx tsx scripts/verify-domain-logic.ts
```

---

## 👥 Demo Kullanıcı Rolleri

Sağ üstteki profil ikonuna tıklayarak veya oturum kapatıp açarak aşağıdaki kullanıcılar arasında geçiş yapabilirsiniz:

| Kullanıcı | E-posta | Şirket / Rol | Açıklama |
|---|---|---|---|
| **Elif Yılmaz** | `elif@yesilenerji.com` | Yeşil Enerji Ajansı (Yönetici) | Referans ekrandaki hazır blog yazısı ve kaynaklara sahip. |
| **Can Demir** | `can@yesilenerji.com` | Yeşil Enerji Ajansı (Editör) | İçerik onay ve düzenleme yetkisine sahip. |
| **Mert Aksoy** | `mert@istasyon.ai` | İstasyon Ekibi (Platform Sahibi) | Bizim şirketimizin bağımsız hesabı. |
| **Ahmet Karaca** | `ahmet@pamukadim.com` | Pamuk Adım Çorap (Yönetici) | Tamamen izole ikinci müşteri şirketi. |
| **Sistem Yöneticisi** | `superadmin@bloguret.com` | Süper Admin | Başvuruları onaylar, tüm şirketleri izler. |
| **Murat Arslan** | `basvuran@yenigirisim.com` | Yeni Girişim Ltd. (Beklemede) | Henüz onaylanmamış başvuru ekranını görüntüler. |

---

## 🗄️ Canlı Supabase Kurulumu

Canlı ortama geçildiğinde:
1. Supabase projenizde `supabase/migrations/001_initial_schema.sql` dosyasını çalıştırarak 16 tabloyu ve RLS politikalarını oluşturun.
2. İsteğe bağlı olarak `supabase/seed.sql` dosyasındaki tohum verilerini yükleyin.
3. `.env.local` dosyasında `NEXT_PUBLIC_APP_MODE=live`, `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerlerini tanımlayın.
