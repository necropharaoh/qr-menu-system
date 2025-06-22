const express = require('express');
const db = require('../utils/database');
const router = express.Router();

// Tüm siparişleri getir
router.get('/', (req, res) => {
  const query = `
    SELECT o.*, t.table_number,
           GROUP_CONCAT(mi.name || ' x' || oi.quantity) as items
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  
  db.all(query, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(orders);
  });
});

// Belirli bir siparişi getir
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // Sipariş bilgileri
  db.get(`
    SELECT o.*, t.table_number 
    FROM orders o 
    LEFT JOIN tables t ON o.table_id = t.id 
    WHERE o.id = ?
  `, [id], (err, order) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    
    // Sipariş öğeleri
    db.all(`
      SELECT oi.*, mi.name, mi.description, mi.image
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `, [id], (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      
      order.items = items;
      res.json(order);
    });
  });
});

// Yeni sipariş oluştur
router.post('/', (req, res) => {
  const { table_id, items, notes } = req.body;
  
  if (!table_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Masa ID ve sipariş öğeleri gerekli' });
  }
  
  // Toplam tutarı hesapla
  let totalAmount = 0;
  for (const item of items) {
    totalAmount += item.price * item.quantity;
  }
  
  db.run(`
    INSERT INTO orders (table_id, total_amount, notes, status) 
    VALUES (?, ?, ?, 'pending')
  `, [table_id, totalAmount, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    
    const orderId = this.lastID;
    
    // Sipariş öğelerini ekle
    const insertPromises = items.map(item => {
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) 
          VALUES (?, ?, ?, ?, ?)
        `, [orderId, item.menu_item_id, item.quantity, item.price, item.notes], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
    
    Promise.all(insertPromises)
      .then(() => {
        res.json({ 
          id: orderId, 
          message: 'Sipariş oluşturuldu',
          total_amount: totalAmount
        });
      })
      .catch(err => {
        res.status(500).json({ error: 'Sipariş öğeleri eklenirken hata oluştu' });
      });
  });
});

// Sipariş durumunu güncelle
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Geçersiz durum' });
  }
  
  db.run(`
    UPDATE orders 
    SET status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    res.json({ message: 'Sipariş durumu güncellendi' });
  });
});

// Sipariş sil
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Önce sipariş öğelerini sil
  db.run('DELETE FROM order_items WHERE order_id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    
    // Sonra siparişi sil
    db.run('DELETE FROM orders WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Sipariş bulunamadı' });
      }
      res.json({ message: 'Sipariş silindi' });
    });
  });
});

// Masaya göre aktif siparişleri getir
router.get('/table/:tableId', (req, res) => {
  const { tableId } = req.params;
  
  db.all(`
    SELECT o.*, 
           GROUP_CONCAT(mi.name || ' x' || oi.quantity) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE o.table_id = ? AND o.status IN ('pending', 'preparing', 'ready')
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, [tableId], (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(orders);
  });
});

module.exports = router; 