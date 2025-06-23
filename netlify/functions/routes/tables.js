const express = require('express');
const pool = require('../utils/database');
const router = express.Router();

// Tüm masaları getir
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tables ORDER BY number');
    res.json(result.rows);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Masa ekle
router.post('/', async (req, res) => {
  try {
    const { number, qr_code } = req.body;
    
    if (!number) {
      return res.status(400).json({ error: 'Masa numarası gerekli' });
    }
    
    const result = await pool.query('INSERT INTO tables (number, qr_code) VALUES ($1, $2) RETURNING id', [number, qr_code]);

    res.json({ id: result.rows[0].id, message: 'Masa eklendi' });
  } catch (error) {
    console.error('Add table error:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'Bu masa numarası zaten mevcut' });
    }
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Masa güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number, qr_code, status } = req.body;
    
    const result = await pool.query('UPDATE tables SET number = $1, qr_code = $2, status = $3 WHERE id = $4 RETURNING *', [number, qr_code, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    res.json({ message: 'Masa güncellendi' });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Masa sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM tables WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    res.json({ message: 'Masa silindi' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Masa durumunu güncelle
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum' });
    }
    
    const result = await pool.query('UPDATE tables SET status = $1 WHERE id = $2 RETURNING *', [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    res.json({ message: 'Masa durumu güncellendi' });
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Masa QR kodunu güncelle
router.put('/:id/qr', async (req, res) => {
  try {
    const { id } = req.params;
    const { qr_code } = req.body;
    
    if (!qr_code) {
      return res.status(400).json({ error: 'QR kod gerekli' });
    }
    
    const result = await pool.query('UPDATE tables SET qr_code = $1 WHERE id = $2 RETURNING *', [qr_code, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    res.json({ message: 'QR kod güncellendi' });
  } catch (error) {
    console.error('Update table QR error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Masa detaylarını getir (siparişler dahil)
router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const tableResult = await pool.query('SELECT * FROM tables WHERE id = $1', [id]);
    const table = tableResult.rows[0];
    if (!table) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }
    const ordersResult = await pool.query(`
      SELECT o.*, 
             STRING_AGG(mi.name || ' x' || oi.quantity, ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.table_id = $1 AND o.status IN ('pending', 'preparing', 'ready')
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [id]);
    table.orders = ordersResult.rows;
    res.json(table);
  } catch (error) {
    console.error('Get table details error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 