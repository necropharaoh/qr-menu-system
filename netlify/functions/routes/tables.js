const express = require('express');
const { query, get, run } = require('../utils/database');
const router = express.Router();

// Tüm masaları getir
router.get('/', async (req, res) => {
  try {
    const tables = await query('SELECT * FROM tables ORDER BY table_number');
    res.json(tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Masa ekle
router.post('/', async (req, res) => {
  try {
    const { table_number, qr_code } = req.body;
    
    if (!table_number) {
      return res.status(400).json({ error: 'Masa numarası gerekli' });
    }
    
    const result = await run(
      'INSERT INTO tables (table_number, qr_code) VALUES (?, ?)',
      [table_number, qr_code]
    );

    res.json({ id: result.id, message: 'Masa eklendi' });
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
    const { table_number, qr_code, status } = req.body;
    
    const result = await run(
      'UPDATE tables SET table_number = ?, qr_code = ?, status = ? WHERE id = ?',
      [table_number, qr_code, status, id]
    );

    if (result.changes === 0) {
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
    
    const result = await run('DELETE FROM tables WHERE id = ?', [id]);

    if (result.changes === 0) {
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
    
    const result = await run(
      'UPDATE tables SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.changes === 0) {
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
    
    const result = await run(
      'UPDATE tables SET qr_code = ? WHERE id = ?',
      [qr_code, id]
    );

    if (result.changes === 0) {
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
    
    const table = await get('SELECT * FROM tables WHERE id = ?', [id]);
    if (!table) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }
    
    // Masanın aktif siparişlerini getir
    const orders = await query(`
      SELECT o.*, 
             GROUP_CONCAT(mi.name || ' x' || oi.quantity) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.table_id = ? AND o.status IN ('pending', 'preparing', 'ready')
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [id]);
    
    table.orders = orders;
    res.json(table);
  } catch (error) {
    console.error('Get table details error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 