const db = require('./database');
const bcrypt = require('bcryptjs');

console.log('QR Menü Sistemi kurulumu başlatılıyor...');

// Veritabanı bağlantısını bekle
setTimeout(async () => {
    try {
        console.log('Veritabanı bağlantısı kontrol ediliyor...');
        
        // Varsayılan admin kullanıcısını kontrol et
        db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, user) => {
            if (err) {
                console.error('Kullanıcı kontrolü hatası:', err);
                return;
            }

            if (!user) {
                console.log('Varsayılan admin kullanıcısı oluşturuluyor...');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                
                db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
                    ['admin', hashedPassword, 'admin'], (err) => {
                    if (err) {
                        console.error('Admin kullanıcısı oluşturma hatası:', err);
                    } else {
                        console.log('✅ Admin kullanıcısı oluşturuldu');
                        console.log('   Kullanıcı adı: admin');
                        console.log('   Şifre: admin123');
                    }
                });
            } else {
                console.log('✅ Admin kullanıcısı zaten mevcut');
            }
        });

        // Restoran bilgilerini kontrol et
        db.get('SELECT * FROM restaurant LIMIT 1', (err, restaurant) => {
            if (err) {
                console.error('Restoran kontrolü hatası:', err);
                return;
            }

            if (!restaurant) {
                console.log('Varsayılan restoran bilgileri oluşturuluyor...');
                
                db.run(`INSERT INTO restaurant (name, address, phone) VALUES (?, ?, ?)`,
                    ['QR Menü Restoran', 'Örnek Adres', '+90 555 123 4567'], (err) => {
                    if (err) {
                        console.error('Restoran oluşturma hatası:', err);
                    } else {
                        console.log('✅ Restoran bilgileri oluşturuldu');
                    }
                });
            } else {
                console.log('✅ Restoran bilgileri zaten mevcut');
            }
        });

        // Kategorileri kontrol et
        db.get('SELECT COUNT(*) as count FROM categories', (err, result) => {
            if (err) {
                console.error('Kategori kontrolü hatası:', err);
                return;
            }

            if (result.count === 0) {
                console.log('Varsayılan kategoriler oluşturuluyor...');
                
                const categories = [
                    ['İçecekler', 'Soğuk ve sıcak içecekler'],
                    ['Ana Yemekler', 'Taze pişmiş ana yemekler'],
                    ['Tatlılar', 'Ev yapımı tatlılar'],
                    ['Salatalar', 'Taze salatalar']
                ];

                categories.forEach(([name, desc]) => {
                    db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [name, desc], (err) => {
                        if (err) {
                            console.error(`Kategori "${name}" oluşturma hatası:`, err);
                        } else {
                            console.log(`✅ Kategori oluşturuldu: ${name}`);
                        }
                    });
                });
            } else {
                console.log('✅ Kategoriler zaten mevcut');
            }
        });

        // Menü öğelerini kontrol et
        db.get('SELECT COUNT(*) as count FROM menu_items', (err, result) => {
            if (err) {
                console.error('Menü öğesi kontrolü hatası:', err);
                return;
            }

            if (result.count === 0) {
                console.log('Varsayılan menü öğeleri oluşturuluyor...');
                
                const menuItems = [
                    [1, 'Kola', 'Soğuk kola', 15.00],
                    [1, 'Su', 'Doğal kaynak suyu', 5.00],
                    [2, 'Tavuk Şiş', 'Izgara tavuk şiş', 45.00],
                    [2, 'Kebap', 'Özel soslu kebap', 55.00],
                    [3, 'Baklava', 'Ev yapımı baklava', 25.00],
                    [4, 'Çoban Salata', 'Taze sebzeler', 20.00]
                ];

                menuItems.forEach(([catId, name, desc, price]) => {
                    db.run('INSERT INTO menu_items (category_id, name, description, price) VALUES (?, ?, ?, ?)',
                        [catId, name, desc, price], (err) => {
                        if (err) {
                            console.error(`Menü öğesi "${name}" oluşturma hatası:`, err);
                        } else {
                            console.log(`✅ Menü öğesi oluşturuldu: ${name}`);
                        }
                    });
                });
            } else {
                console.log('✅ Menü öğeleri zaten mevcut');
            }
        });

        // Masaları kontrol et
        db.get('SELECT COUNT(*) as count FROM tables', (err, result) => {
            if (err) {
                console.error('Masa kontrolü hatası:', err);
                return;
            }

            if (result.count === 0) {
                console.log('Varsayılan masalar oluşturuluyor...');
                
                for (let i = 1; i <= 10; i++) {
                    db.run('INSERT INTO tables (table_number) VALUES (?)', [i], (err) => {
                        if (err) {
                            console.error(`Masa ${i} oluşturma hatası:`, err);
                        } else {
                            console.log(`✅ Masa oluşturuldu: ${i}`);
                        }
                    });
                }
            } else {
                console.log('✅ Masalar zaten mevcut');
            }
        });

        console.log('\n🎉 Kurulum tamamlandı!');
        console.log('\n📋 Erişim Bilgileri:');
        console.log('   Admin Paneli: http://localhost:3000/admin');
        console.log('   QR Menü Örneği: http://localhost:3000/menu/1');
        console.log('\n🔐 Giriş Bilgileri:');
        console.log('   Kullanıcı adı: admin');
        console.log('   Şifre: admin123');
        console.log('\n🚀 Sunucuyu başlatmak için: npm start');

    } catch (error) {
        console.error('Kurulum hatası:', error);
    }
}, 2000); 