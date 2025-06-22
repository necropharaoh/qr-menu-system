const express = require('express');
const db = require('../utils/database');
const router = express.Router();

// Restoran bilgilerini getir
router.get('/', (req, res) => {
  db.get('SELECT * FROM restaurant LIMIT 1', (err, restaurant) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(restaurant || {});
  });
});

// Restoran bilgilerini güncelle
router.put('/', (req, res) => {
  const { name, address, phone, logo, settings } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Restoran adı gerekli' });
  }
  
  db.run(`
    INSERT OR REPLACE INTO restaurant (id, name, address, phone, logo, settings) 
    VALUES (1, ?, ?, ?, ?, ?)
  `, [name, address, phone, logo, settings], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json({ message: 'Restoran bilgileri güncellendi' });
  });
});

// Logo yükleme (basit implementasyon)
router.post('/logo', (req, res) => {
  // Bu endpoint dosya yükleme için kullanılabilir
  // Şimdilik basit bir response döndürüyoruz
  res.json({ 
    message: 'Logo yükleme endpoint\'i',
    note: 'Dosya yükleme implementasyonu gerekli'
  });
});

// Sistem ayarlarını getir
router.get('/settings', (req, res) => {
  db.get('SELECT settings FROM restaurant LIMIT 1', (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    
    let settings = {};
    if (result && result.settings) {
      try {
        settings = JSON.parse(result.settings);
      } catch (e) {
        settings = {};
      }
    }
    
    res.json(settings);
  });
});

// Sistem ayarlarını güncelle
router.put('/settings', (req, res) => {
  const settings = req.body;
  
  const settingsJson = JSON.stringify(settings);
  
  db.run(`
    UPDATE restaurant 
    SET settings = ? 
    WHERE id = 1
  `, [settingsJson], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (this.changes === 0) {
      // Restoran kaydı yoksa oluştur
      db.run(`
        INSERT INTO restaurant (id, name, settings) 
        VALUES (1, 'QR Menü Restoran', ?)
      `, [settingsJson], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json({ message: 'Ayarlar kaydedildi' });
      });
    } else {
      res.json({ message: 'Ayarlar güncellendi' });
    }
  });
});

// Sistem durumu
router.get('/status', (req, res) => {
  const status = {
    database: 'connected',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
  
  res.json(status);
});

module.exports = router; 