const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Netlify Functions için geçici dosya yolu
const dbPath = path.join('/tmp', 'restaurant.db');

let db = null;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Veritabanı bağlantı hatası:', err);
      } else {
        console.log('SQLite veritabanına bağlandı');
        initDatabase();
      }
    });
  }
  return db;
}

function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS restaurant (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      logo TEXT,
      settings TEXT
    );

    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER UNIQUE NOT NULL,
      qr_code TEXT,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      sort_order INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image TEXT,
      available BOOLEAN DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER,
      status TEXT DEFAULT 'pending',
      total_amount DECIMAL(10,2) DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (table_id) REFERENCES tables (id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      menu_item_id INTEGER,
      quantity INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
    );

    CREATE TABLE IF NOT EXISTS waiter_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (table_id) REFERENCES tables (id)
    );
  `;

  db.exec(schema, (err) => {
    if (err) {
      console.error('Veritabanı şeması oluşturma hatası:', err);
    } else {
      console.log('Veritabanı şeması başarıyla oluşturuldu');
      createDefaultData();
    }
  });
}

function createDefaultData() {
  // Varsayılan admin kullanıcısı
  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, 
    ['admin', adminPassword, 'admin']);

  // Varsayılan restoran bilgileri
  db.run(`INSERT OR IGNORE INTO restaurant (name, address, phone) VALUES (?, ?, ?)`,
    ['QR Menü Restoran', 'Örnek Adres', '+90 555 123 4567']);

  // Örnek kategoriler
  const categories = [
    ['İçecekler', 'Soğuk ve sıcak içecekler'],
    ['Ana Yemekler', 'Taze pişmiş ana yemekler'],
    ['Tatlılar', 'Ev yapımı tatlılar'],
    ['Salatalar', 'Taze salatalar']
  ];

  categories.forEach(([name, desc]) => {
    db.run(`INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)`, [name, desc]);
  });

  // Örnek menü öğeleri
  const menuItems = [
    [1, 'Kola', 'Soğuk kola', 15.00],
    [1, 'Su', 'Doğal kaynak suyu', 5.00],
    [2, 'Tavuk Şiş', 'Izgara tavuk şiş', 45.00],
    [2, 'Kebap', 'Özel soslu kebap', 55.00],
    [3, 'Baklava', 'Ev yapımı baklava', 25.00],
    [4, 'Çoban Salata', 'Taze sebzeler', 20.00]
  ];

  menuItems.forEach(([catId, name, desc, price]) => {
    db.run(`INSERT OR IGNORE INTO menu_items (category_id, name, description, price) VALUES (?, ?, ?, ?)`,
      [catId, name, desc, price]);
  });

  // Örnek masalar
  for (let i = 1; i <= 10; i++) {
    db.run(`INSERT OR IGNORE INTO tables (table_number) VALUES (?)`, [i]);
  }
}

// Promise wrapper for database operations
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

module.exports = {
  getDatabase,
  query,
  get,
  run
}; 