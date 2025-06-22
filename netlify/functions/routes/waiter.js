const express = require('express');
const { query, get, run } = require('../utils/database');
const router = express.Router();

// Tüm garson çağrılarını getir
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT wc.*, t.table_number
      FROM waiter_calls wc
      LEFT JOIN tables t ON wc.table_id = t.id
      ORDER BY wc.created_at DESC
    `;
    
    const calls = await query(sql);
    res.json(calls);
  } catch (error) {
    console.error('Get waiter calls error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Bekleyen garson çağrılarını getir
router.get('/pending', async (req, res) => {
  try {
    const sql = `
      SELECT wc.*, t.table_number
      FROM waiter_calls wc
      LEFT JOIN tables t ON wc.table_id = t.id
      WHERE wc.status = 'pending'
      ORDER BY wc.created_at ASC
    `;
    
    const calls = await query(sql);
    res.json(calls);
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
    const existingCall = await get('SELECT id FROM waiter_calls WHERE table_id = ? AND status = "pending"', [table_id]);
    
    if (existingCall) {
      return res.status(400).json({ error: 'Bu masadan zaten bekleyen bir çağrı var' });
    }
    
    // Yeni çağrı oluştur
    const result = await run('INSERT INTO waiter_calls (table_id, status) VALUES (?, "pending")', [table_id]);
    
    res.json({ 
      id: result.id, 
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
    
    const result = await run(`
      UPDATE waiter_calls 
      SET status = ?, resolved_at = ${resolvedAt}
      WHERE id = ?
    `, [status, id]);

    if (result.changes === 0) {
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
    
    const result = await run('DELETE FROM waiter_calls WHERE id = ?', [id]);

    if (result.changes === 0) {
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
      SELECT wc.*, t.table_number
      FROM waiter_calls wc
      LEFT JOIN tables t ON wc.table_id = t.id
      WHERE wc.table_id = ?
      ORDER BY wc.created_at DESC
    `;
    
    const calls = await query(sql, [tableId]);
    res.json(calls);
  } catch (error) {
    console.error('Get table waiter calls error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Tüm bekleyen çağrıları çöz
router.put('/resolve-all', async (req, res) => {
  try {
    const result = await run(`
      UPDATE waiter_calls 
      SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
      WHERE status = 'pending'
    `);

    res.json({ 
      message: `${result.changes} garson çağrısı çözüldü`,
      resolved_count: result.changes
    });
  } catch (error) {
    console.error('Resolve all calls error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 