// Netlify Functions için in-memory veritabanı
// SQLite yerine JavaScript objeleri kullanıyoruz

// In-memory veritabanı
let db = {
  users: [],
  restaurant: [],
  tables: [],
  categories: [],
  menu_items: [],
  orders: [],
  order_items: [],
  waiter_calls: []
};

// Varsayılan verileri oluştur
function initDatabase() {
  console.log('In-memory veritabanı başlatılıyor...');
  
  // Varsayılan admin kullanıcısı
  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  if (db.users.length === 0) {
    db.users.push({
      id: 1,
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      created_at: new Date().toISOString()
    });
  }

  // Varsayılan restoran bilgileri
  if (db.restaurant.length === 0) {
    db.restaurant.push({
      id: 1,
      name: 'QR Menü Restoran',
      address: 'Örnek Adres',
      phone: '+90 555 123 4567',
      logo: '',
      settings: '{}'
    });
  }

  // Örnek kategoriler
  if (db.categories.length === 0) {
    const categories = [
      { id: 1, name: 'İçecekler', description: 'Soğuk ve sıcak içecekler', image: '', sort_order: 0, active: true },
      { id: 2, name: 'Ana Yemekler', description: 'Taze pişmiş ana yemekler', image: '', sort_order: 1, active: true },
      { id: 3, name: 'Tatlılar', description: 'Ev yapımı tatlılar', image: '', sort_order: 2, active: true },
      { id: 4, name: 'Salatalar', description: 'Taze salatalar', image: '', sort_order: 3, active: true }
    ];
    db.categories.push(...categories);
  }

  // Örnek menü öğeleri
  if (db.menu_items.length === 0) {
    const menuItems = [
      { id: 1, category_id: 1, name: 'Kola', description: 'Soğuk kola', price: 15.00, image: '', available: true, sort_order: 0 },
      { id: 2, category_id: 1, name: 'Su', description: 'Doğal kaynak suyu', price: 5.00, image: '', available: true, sort_order: 1 },
      { id: 3, category_id: 2, name: 'Tavuk Şiş', description: 'Izgara tavuk şiş', price: 45.00, image: '', available: true, sort_order: 0 },
      { id: 4, category_id: 2, name: 'Kebap', description: 'Özel soslu kebap', price: 55.00, image: '', available: true, sort_order: 1 },
      { id: 5, category_id: 3, name: 'Baklava', description: 'Ev yapımı baklava', price: 25.00, image: '', available: true, sort_order: 0 },
      { id: 6, category_id: 4, name: 'Çoban Salata', description: 'Taze sebzeler', price: 20.00, image: '', available: true, sort_order: 0 }
    ];
    db.menu_items.push(...menuItems);
  }

  // Örnek masalar
  if (db.tables.length === 0) {
    for (let i = 1; i <= 10; i++) {
      db.tables.push({
        id: i,
        table_number: i,
        qr_code: '',
        status: 'available',
        created_at: new Date().toISOString()
      });
    }
  }

  console.log('In-memory veritabanı başlatıldı');
}

// Veritabanını başlat
initDatabase();

// Promise wrapper for database operations
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      // Basit SQL parsing (sadece SELECT için)
      if (sql.toLowerCase().includes('select')) {
        const tableMatch = sql.match(/from\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          if (db[tableName]) {
            // Basit WHERE koşulu parsing
            if (sql.toLowerCase().includes('where')) {
              const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
              if (whereMatch && params.length > 0) {
                const field = whereMatch[1];
                const value = params[0];
                const filtered = db[tableName].filter(item => item[field] === value);
                resolve(filtered);
              } else {
                resolve(db[tableName]);
              }
            } else {
              resolve(db[tableName]);
            }
          } else {
            resolve([]);
          }
        } else {
          resolve([]);
        }
      } else {
        resolve([]);
      }
    } catch (error) {
      reject(error);
    }
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      // Basit SQL parsing (sadece SELECT için)
      if (sql.toLowerCase().includes('select')) {
        const tableMatch = sql.match(/from\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          if (db[tableName]) {
            // Basit WHERE koşulu parsing
            if (sql.toLowerCase().includes('where')) {
              const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
              if (whereMatch && params.length > 0) {
                const field = whereMatch[1];
                const value = params[0];
                const found = db[tableName].find(item => item[field] === value);
                resolve(found || null);
              } else {
                resolve(db[tableName][0] || null);
              }
            } else {
              resolve(db[tableName][0] || null);
            }
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    } catch (error) {
      reject(error);
    }
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      // INSERT işlemleri için
      if (sql.toLowerCase().includes('insert')) {
        const tableMatch = sql.match(/into\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          if (db[tableName]) {
            const newId = Math.max(...db[tableName].map(item => item.id || 0)) + 1;
            const newItem = { id: newId };
            
            // Basit INSERT parsing (sadece VALUES için)
            const valuesMatch = sql.match(/values\s*\(([^)]+)\)/i);
            if (valuesMatch) {
              const fields = valuesMatch[1].split(',').map(f => f.trim().replace(/[`'"]/g, ''));
              fields.forEach((field, index) => {
                if (params[index] !== undefined) {
                  newItem[field] = params[index];
                }
              });
            }
            
            db[tableName].push(newItem);
            resolve({ id: newId, changes: 1 });
          }
        }
      }
      // UPDATE işlemleri için
      else if (sql.toLowerCase().includes('update')) {
        const tableMatch = sql.match(/update\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          if (db[tableName]) {
            // Basit UPDATE parsing
            const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
            if (whereMatch && params.length > 0) {
              const field = whereMatch[1];
              const value = params[0];
              const index = db[tableName].findIndex(item => item[field] === value);
              if (index !== -1) {
                // Basit SET parsing
                const setMatch = sql.match(/set\s+(\w+)\s*=\s*\?/i);
                if (setMatch && params.length > 1) {
                  const setField = setMatch[1];
                  const setValue = params[1];
                  db[tableName][index][setField] = setValue;
                  resolve({ id: db[tableName][index].id, changes: 1 });
                }
              }
            }
          }
        }
      }
      // DELETE işlemleri için
      else if (sql.toLowerCase().includes('delete')) {
        const tableMatch = sql.match(/from\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          if (db[tableName]) {
            const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
            if (whereMatch && params.length > 0) {
              const field = whereMatch[1];
              const value = params[0];
              const index = db[tableName].findIndex(item => item[field] === value);
              if (index !== -1) {
                db[tableName].splice(index, 1);
                resolve({ id: 0, changes: 1 });
              }
            }
          }
        }
      }
      
      resolve({ id: 0, changes: 0 });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getDatabase: () => db,
  query,
  get,
  run
}; 