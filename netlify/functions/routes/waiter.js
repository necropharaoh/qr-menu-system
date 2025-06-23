const express = require('express');
const pool = require('../utils/database');
const router = express.Router();

// Tüm garson çağrılarını getir
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT wc.*, t.number as number
      FROM waiter_calls wc
      LEFT JOIN tables t ON wc.table_id = t.id
      ORDER BY wc.created_at DESC
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error('Get waiter calls error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Bekleyen garson çağrılarını getir
router.get('/pending', async (req, res) => {
  try {
    const sql = `
      SELECT wc.*, t.number as number
      FROM waiter_calls wc
      LEFT JOIN tables t ON wc.table_id = t.id
      WHERE wc.status = 'pending'
      ORDER BY wc.created_at ASC
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending calls error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Yeni garson çağrısı oluştur
router.post('/', async (req, res) => {
  try {
    const { table_id } = req.body;
    
    if (!table_id) {
      return res.status(400).json({ error: 'Masa ID gerekli' });
    }
    
    // Aynı masadan bekleyen çağrı var mı kontrol et
    const existingCall = await pool.query('SELECT id FROM waiter_calls WHERE table_id = $1 AND status = $2', [table_id, 'pending']);
    
    if (existingCall.rows.length > 0) {
      return res.status(400).json({ error: 'Bu masadan zaten bekleyen bir çağrı var' });
    }
    
    // Yeni çağrı oluştur
    const result = await pool.query('INSERT INTO waiter_calls (table_id, status) VALUES ($1, $2) RETURNING id', [table_id, 'pending']);
    
    res.json({ 
      id: result.rows[0].id, 
      message: 'Garson çağrısı oluşturuldu',
      table_id: table_id
    });
  } catch (error) {
    console.error('Create waiter call error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Garson çağrısı durumunu güncelle
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum' });
    }
    
    const resolvedAt = status === 'resolved' ? 'CURRENT_TIMESTAMP' : 'NULL';
    
    const result = await pool.query(`
      UPDATE waiter_calls 
      SET status = $1, resolved_at = $2
      WHERE id = $3
    `, [status, resolvedAt, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Garson çağrısı bulunamadı' });
    }

    res.json({ message: 'Garson çağrısı durumu güncellendi' });
  } catch (error) {
    console.error('Update waiter call status error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Garson çağrısı sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM waiter_calls WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Garson çağrısı bulunamadı' });
    }

    res.json({ message: 'Garson çağrısı silindi' });
  } catch (error) {
    console.error('Delete waiter call error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Masaya göre garson çağrılarını getir
router.get('/table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    
    const sql = `
      SELECT wc.*, t.number as number
      FROM waiter_calls wc
      LEFT JOIN tables t ON wc.table_id = t.id
      WHERE wc.table_id = $1
      ORDER BY wc.created_at DESC
    `;
    
    const result = await pool.query(sql, [tableId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get table waiter calls error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Tüm bekleyen çağrıları çöz
router.put('/resolve-all', async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE waiter_calls 
      SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
      WHERE status = 'pending'
    `);

    res.json({ 
      message: `${result.rowCount} garson çağrısı çözüldü`,
      resolved_count: result.rowCount
    });
  } catch (error) {
    console.error('Resolve all calls error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 