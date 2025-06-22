const express = require('express');
const db = require('../utils/database');
const router = express.Router();

// Tüm masaları getir
router.get('/', (req, res) => {
  db.all('SELECT * FROM tables ORDER BY table_number', (err, tables) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(tables);
  });
});

// Masa ekle
router.post('/', (req, res) => {
  const { table_number, qr_code } = req.body;
  
  if (!table_number) {
    return res.status(400).json({ error: 'Masa numarası gerekli' });
  }
  
  db.run(
    'INSERT INTO tables (table_number, qr_code) VALUES (?, ?)',
    [table_number, qr_code],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'Bu masa numarası zaten mevcut' });
        }
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      res.json({ id: this.lastID, message: 'Masa eklendi' });
    }
  );
});

// Masa güncelle
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { table_number, qr_code, status } = req.body;
  
  db.run(
    'UPDATE tables SET table_number = ?, qr_code = ?, status = ? WHERE id = ?',
    [table_number, qr_code, status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }
      res.json({ message: 'Masa güncellendi' });
    }
  );
});

// Masa sil
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM tables WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }
    res.json({ message: 'Masa silindi' });
  });
});

// Masa durumunu güncelle
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Geçersiz durum' });
  }
  
  db.run(
    'UPDATE tables SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }
      res.json({ message: 'Masa durumu güncellendi' });
    }
  );
});

// Masa QR kodunu güncelle
router.put('/:id/qr', (req, res) => {
  const { id } = req.params;
  const { qr_code } = req.body;
  
  if (!qr_code) {
    return res.status(400).json({ error: 'QR kod gerekli' });
  }
  
  db.run(
    'UPDATE tables SET qr_code = ? WHERE id = ?',
    [qr_code, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Masa bulunamadı' });
      }
      res.json({ message: 'QR kod güncellendi' });
    }
  );
});

// Masa detaylarını getir (siparişler dahil)
router.get('/:id/details', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM tables WHERE id = ?', [id], (err, table) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (!table) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }
    
    // Masanın aktif siparişlerini getir
    db.all(`
      SELECT o.*, 
             GROUP_CONCAT(mi.name || ' x' || oi.quantity) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.table_id = ? AND o.status IN ('pending', 'preparing', 'ready')
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [id], (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      
      table.orders = orders;
      res.json(table);
    });
  });
});

module.exports = router; 