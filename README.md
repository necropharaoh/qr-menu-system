# QR Menü Sistemi - Netlify Functions

Modern restoranlar için geliştirilmiş, QR kod tabanlı dijital menü ve sipariş yönetim sistemi. Netlify Functions kullanarak serverless mimaride çalışır.

## 🚀 Özellikler

### Müşteri Tarafı
- 📱 **QR Kod ile Menü Erişimi**: Her masa için özel QR kod
- 🍽️ **Kategori Bazlı Menü**: Kolay navigasyon
- 🛒 **Sepet Yönetimi**: Gerçek zamanlı sepet işlemleri
- 📞 **Garson Çağrısı**: Tek tıkla garson çağırma
- 🔊 **Ses Bildirimleri**: Sipariş durumu güncellemeleri
- 💳 **Sipariş Takibi**: Gerçek zamanlı sipariş durumu

### Admin Paneli
- 📊 **Dashboard**: Gerçek zamanlı istatistikler
- 🍽️ **Menü Yönetimi**: Kategori ve ürün ekleme/düzenleme
- 📋 **Sipariş Yönetimi**: Sipariş durumu güncelleme
- 🏠 **Masa Yönetimi**: QR kod oluşturma ve masa durumu
- 📈 **Analitik**: Satış raporları ve performans analizi
- ⚙️ **Ayarlar**: Restoran bilgileri ve sistem ayarları

### Teknik Özellikler
- 🔐 **JWT Kimlik Doğrulama**: Güvenli admin erişimi
- 🗄️ **SQLite Veritabanı**: Hafif ve hızlı veri depolama
- 🌐 **Netlify Functions**: Serverless backend
- 📱 **Responsive Tasarım**: Tüm cihazlarda uyumlu
- 🔄 **Gerçek Zamanlı**: Anlık güncellemeler

## 🛠️ Kurulum

### Gereksinimler
- Node.js 18+
- Netlify CLI
- Git

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd qr-menu-system
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Netlify CLI'yi yükleyin**
```bash
npm install -g netlify-cli
```

4. **Netlify'da oturum açın**
```bash
netlify login
```

5. **Yerel geliştirme sunucusunu başlatın**
```bash
npm run dev
```

6. **Netlify'a deploy edin**
```bash
npm run deploy
```

## 📁 Proje Yapısı

```
qr-menu-system/
├── netlify/
│   ├── functions/
│   │   ├── api.js                 # Ana API endpoint
│   │   ├── utils/
│   │   │   └── database.js        # Veritabanı yardımcıları
│   │   └── routes/
│   │       ├── auth.js            # Kimlik doğrulama
│   │       ├── menu.js            # Menü yönetimi
│   │       ├── orders.js          # Sipariş yönetimi
│   │       ├── tables.js          # Masa yönetimi
│   │       ├── waiter.js          # Garson çağrıları
│   │       ├── analytics.js       # İstatistikler
│   │       └── restaurant.js      # Restoran ayarları
├── frontend/
│   ├── admin/
│   │   ├── admin.html             # Admin paneli
│   │   ├── scripts/
│   │   │   └── admin.js           # Admin JavaScript
│   │   └── styles/
│   │       └── admin.css          # Admin stilleri
│   └── menu/
│       ├── customer.html          # Müşteri menü sayfası
│       ├── scripts/
│   │   ├── menu.js            # Menü JavaScript
│   │   ├── cart.js            # Sepet yönetimi
│   │   ├── websocket.js       # WebSocket bağlantısı
│   │   ├── waiter-call.js     # Garson çağrısı
│   │   └── utils.js           # Yardımcı fonksiyonlar
│   └── styles/
│       └── main.css           # Müşteri stilleri
├── netlify.toml                   # Netlify yapılandırması
├── package.json                   # Proje bağımlılıkları
└── README.md                      # Bu dosya
```

## 🔧 Yapılandırma

### Netlify Environment Variables

Netlify dashboard'da aşağıdaki environment variable'ları ayarlayın:

```env
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

### Veritabanı

Sistem otomatik olarak SQLite veritabanını `/tmp` dizininde oluşturur. Netlify Functions'da her function çağrısında veritabanı yeniden oluşturulur.

## 📱 Kullanım

### Admin Paneli Erişimi

1. Netlify domain'inizde `/admin` adresine gidin
2. Varsayılan giriş bilgileri:
   - **Kullanıcı Adı**: `admin`
   - **Şifre**: `admin123`

### QR Kod Oluşturma

1. Admin panelinde "Masalar" sekmesine gidin
2. Masa ekleyin veya mevcut masayı düzenleyin
3. "QR Kod" butonuna tıklayın
4. QR kodu yazdırın ve masaya yerleştirin

### Müşteri Deneyimi

1. Müşteriler QR kodu telefonlarıyla tarar
2. Menü sayfası açılır
3. Kategorilerden ürün seçer
4. Sepete ekler
5. Siparişi gönderir
6. Garson çağrısı yapabilir

## 🔌 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/login` - Giriş yapma
- `GET /api/auth/verify` - Token doğrulama

### Menü Yönetimi
- `GET /api/menu/categories` - Kategorileri listele
- `POST /api/menu/categories` - Kategori ekle
- `PUT /api/menu/categories/:id` - Kategori güncelle
- `DELETE /api/menu/categories/:id` - Kategori sil
- `GET /api/menu/items` - Menü öğelerini listele
- `POST /api/menu/items` - Menü öğesi ekle
- `PUT /api/menu/items/:id` - Menü öğesi güncelle
- `DELETE /api/menu/items/:id` - Menü öğesi sil

### Sipariş Yönetimi
- `GET /api/orders` - Siparişleri listele
- `POST /api/orders` - Yeni sipariş oluştur
- `PUT /api/orders/:id/status` - Sipariş durumu güncelle
- `DELETE /api/orders/:id` - Sipariş sil

### Masa Yönetimi
- `GET /api/tables` - Masaları listele
- `POST /api/tables` - Masa ekle
- `PUT /api/tables/:id` - Masa güncelle
- `DELETE /api/tables/:id` - Masa sil

### Garson Çağrıları
- `GET /api/waiter` - Çağrıları listele
- `POST /api/waiter` - Yeni çağrı oluştur
- `PUT /api/waiter/:id/status` - Çağrı durumu güncelle

### İstatistikler
- `GET /api/analytics/overview` - Genel istatistikler
- `GET /api/analytics/daily-sales` - Günlük satışlar
- `GET /api/analytics/popular-items` - Popüler ürünler

## 🚀 Deployment

### Netlify'da Otomatik Deploy

1. GitHub repository'nizi Netlify'a bağlayın
2. Build ayarlarını yapılandırın:
   - **Build command**: `npm run build`
   - **Publish directory**: `.`
   - **Functions directory**: `netlify/functions`

### Manuel Deploy

```bash
# Netlify CLI ile deploy
netlify deploy --prod

# Veya sadece functions
netlify deploy --functions
```

## 🔒 Güvenlik

- JWT token tabanlı kimlik doğrulama
- CORS yapılandırması
- Input validation
- SQL injection koruması
- Rate limiting (Netlify tarafından)

## 📊 Performans

- Serverless mimari sayesinde otomatik ölçeklendirme
- CDN üzerinden statik dosya servisi
- Minimal cold start süreleri
- Optimized bundle boyutları

## 🐛 Sorun Giderme

### Yaygın Sorunlar

1. **Functions çalışmıyor**
   - Netlify CLI'nin güncel olduğundan emin olun
   - Environment variable'ları kontrol edin

2. **Veritabanı hatası**
   - SQLite3 bağımlılığının yüklü olduğundan emin olun
   - `/tmp` dizininin yazılabilir olduğunu kontrol edin

3. **CORS hatası**
   - `netlify.toml` dosyasındaki CORS ayarlarını kontrol edin

### Log Kontrolü

```bash
# Netlify Functions loglarını görüntüle
netlify functions:list
netlify functions:invoke api
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 📞 Destek

Sorularınız için:
- GitHub Issues kullanın
- Email: support@qrmenu.com

## 🔄 Güncellemeler

### v1.0.0
- İlk sürüm
- Netlify Functions desteği
- Temel QR menü özellikleri
- Admin paneli
- Gerçek zamanlı bildirimler

---

**QR Menü Sistemi** - Modern restoranlar için dijital çözüm 