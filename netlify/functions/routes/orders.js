const express = require('express');
const { query, get, run } = require('../utils/database');
const router = express.Router();

// Tüm siparişleri getir
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT o.*, t.table_number,
             GROUP_CONCAT(mi.name || ' x' || oi.quantity) as items
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const orders = await query(sql);
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Belirli bir siparişi getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sipariş bilgileri
    const order = await get(`
      SELECT o.*, t.table_number 
      FROM orders o 
      LEFT JOIN tables t ON o.table_id = t.id 
      WHERE o.id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    
    // Sipariş öğeleri
    const items = await query(`
      SELECT oi.*, mi.name, mi.description, mi.image
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `, [id]);
    
    order.items = items;
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Yeni sipariş oluştur
router.post('/', async (req, res) => {
  try {
    const { table_id, items, notes } = req.body;
    
    if (!table_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Masa ID ve sipariş öğeleri gerekli' });
    }
    
    // Toplam tutarı hesapla
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.price * item.quantity;
    }
    
    // Sipariş oluştur
    const orderResult = await run(`
      INSERT INTO orders (table_id, total_amount, notes, status) 
      VALUES (?, ?, ?, 'pending')
    `, [table_id, totalAmount, notes]);
    
    const orderId = orderResult.id;
    
    // Sipariş öğelerini ekle
    for (const item of items) {
      await run(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) 
        VALUES (?, ?, ?, ?, ?)
      `, [orderId, item.menu_item_id, item.quantity, item.price, item.notes]);
    }
    
    res.json({ 
      id: orderId, 
      message: 'Sipariş oluşturuldu',
      total_amount: totalAmount
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Sipariş oluşturulurken hata oluştu' });
  }
});

// Sipariş durumunu güncelle
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum' });
    }
    
    const result = await run(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [status, id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    res.json({ message: 'Sipariş durumu güncellendi' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Sipariş sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Önce sipariş öğelerini sil
    await run('DELETE FROM order_items WHERE order_id = ?', [id]);
    
    // Sonra siparişi sil
    const result = await run('DELETE FROM orders WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    res.json({ message: 'Sipariş silindi' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Masaya göre aktif siparişleri getir
router.get('/table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    
    const sql = `
      SELECT o.*, 
             GROUP_CONCAT(mi.name || ' x' || oi.quantity) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.table_id = ? AND o.status IN ('pending', 'preparing', 'ready')
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const orders = await query(sql, [tableId]);
    res.json(orders);
  } catch (error) {
    console.error('Get table orders error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 