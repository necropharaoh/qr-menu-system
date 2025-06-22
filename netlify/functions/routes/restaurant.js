const express = require('express');
const pool = require('../utils/database');
const router = express.Router();

// Restoran bilgilerini getir
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurant LIMIT 1');
    const restaurant = result.rows[0];
    if (!restaurant) {
      return res.status(404).json({ error: 'Restoran bilgileri bulunamadı' });
    }
    if (restaurant.settings) {
      try {
        restaurant.settings = JSON.parse(restaurant.settings);
      } catch (e) {
        restaurant.settings = {};
      }
    } else {
      restaurant.settings = {};
    }
    res.json(restaurant);
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Restoran bilgilerini güncelle
router.put('/', async (req, res) => {
  try {
    const { name, address, phone, logo, settings } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Restoran adı gerekli' });
    }
    
    const settingsJson = settings ? JSON.stringify(settings) : null;
    
    const result = await pool.query(`
      UPDATE restaurant 
      SET name = ?, address = ?, phone = ?, logo = ?, settings = ?
      WHERE id = (SELECT id FROM restaurant LIMIT 1)
    `, [name, address, phone, logo, settingsJson]);

    if (result.rowCount === 0) {
      // Eğer güncelleme yapılamadıysa, yeni kayıt oluştur
      await pool.query(`
        INSERT INTO restaurant (name, address, phone, logo, settings)
        VALUES (?, ?, ?, ?, ?)
      `, [name, address, phone, logo, settingsJson]);
    }

    res.json({ message: 'Restoran bilgileri güncellendi' });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Restoran ayarlarını getir
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT settings FROM restaurant LIMIT 1');
    const restaurant = result.rows[0];
    if (!restaurant || !restaurant.settings) {
      return res.json({});
    }
    try {
      const settings = JSON.parse(restaurant.settings);
      res.json(settings);
    } catch (e) {
      res.json({});
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Restoran ayarlarını güncelle
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    const settingsJson = JSON.stringify(settings);
    
    const result = await pool.query(`
      UPDATE restaurant 
      SET settings = ?
      WHERE id = (SELECT id FROM restaurant LIMIT 1)
    `, [settingsJson]);

    if (result.rowCount === 0) {
      // Eğer güncelleme yapılamadıysa, yeni kayıt oluştur
      await pool.query(`
        INSERT INTO restaurant (name, settings)
        VALUES ('QR Menü Restoran', ?)
      `, [settingsJson]);
    }

    res.json({ message: 'Ayarlar güncellendi' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Sistem durumu
router.get('/status', async (req, res) => {
  try {
    await pool.query('SELECT 1 as test');
    const tableCount = await pool.query('SELECT COUNT(*) as count FROM tables');
    const menuItemCount = await pool.query('SELECT COUNT(*) as count FROM menu_items');
    const categoryCount = await pool.query('SELECT COUNT(*) as count FROM categories');
    res.json({
      status: 'online',
      database: 'connected',
      tables: tableCount.rows[0].count,
      menu_items: menuItemCount.rows[0].count,
      categories: categoryCount.rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Sistem bilgileri
router.get('/info', async (req, res) => {
  try {
    const result = await pool.query('SELECT name, address, phone FROM restaurant LIMIT 1');
    const restaurant = result.rows[0];
    res.json({
      name: restaurant?.name || 'QR Menü Sistemi',
      address: restaurant?.address || '',
      phone: restaurant?.phone || '',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      platform: 'Netlify Functions',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get info error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 