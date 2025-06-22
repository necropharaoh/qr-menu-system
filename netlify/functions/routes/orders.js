const express = require('express');
const pool = require('../utils/database');
const router = express.Router();

// Tüm siparişleri getir
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT o.*, t.table_number,
             STRING_AGG(mi.name || ' x' || oi.quantity, ', ') as items
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      GROUP BY o.id, t.table_number
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Belirli bir siparişi getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderResult = await pool.query(`
      SELECT o.*, t.table_number 
      FROM orders o 
      LEFT JOIN tables t ON o.table_id = t.id 
      WHERE o.id = $1
    `, [id]);
    const order = orderResult.rows[0];
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    const itemsResult = await pool.query(`
      SELECT oi.*, mi.name, mi.description, mi.image
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
    `, [id]);
    order.items = itemsResult.rows;
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
    const orderResult = await pool.query(`
      INSERT INTO orders (table_id, total_amount, notes, status) 
      VALUES ($1, $2, $3, 'pending')
      RETURNING id
    `, [table_id, totalAmount, notes]);
    
    const orderId = orderResult.rows[0].id;
    
    // Sipariş öğelerini ekle
    for (const item of items) {
      await pool.query(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) 
        VALUES ($1, $2, $3, $4, $5)
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
    
    const result = await pool.query(`
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [status, id]);

    if (result.rowCount === 0) {
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
    await pool.query('DELETE FROM order_items WHERE order_id = $1', [id]);
    
    // Sonra siparişi sil
    const result = await pool.query('DELETE FROM orders WHERE id = $1', [id]);

    if (result.rowCount === 0) {
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
             STRING_AGG(mi.name || ' x' || oi.quantity, ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.table_id = $1 AND o.status IN ('pending', 'preparing', 'ready')
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(sql, [tableId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get table orders error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 