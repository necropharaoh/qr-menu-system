const express = require('express');
const db = require('../utils/database');
const router = express.Router();

// Tüm garson çağrılarını getir
router.get('/', (req, res) => {
  const query = `
    SELECT wc.*, t.table_number
    FROM waiter_calls wc
    LEFT JOIN tables t ON wc.table_id = t.id
    ORDER BY wc.created_at DESC
  `;
  
  db.all(query, (err, calls) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(calls);
  });
});

// Bekleyen garson çağrılarını getir
router.get('/pending', (req, res) => {
  const query = `
    SELECT wc.*, t.table_number
    FROM waiter_calls wc
    LEFT JOIN tables t ON wc.table_id = t.id
    WHERE wc.status = 'pending'
    ORDER BY wc.created_at ASC
  `;
  
  db.all(query, (err, calls) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(calls);
  });
});

// Yeni garson çağrısı oluştur
router.post('/', (req, res) => {
  const { table_id } = req.body;
  
  if (!table_id) {
    return res.status(400).json({ error: 'Masa ID gerekli' });
  }
  
  // Aynı masadan bekleyen çağrı var mı kontrol et
  db.get('SELECT id FROM waiter_calls WHERE table_id = ? AND status = "pending"', 
    [table_id], (err, existingCall) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    
    if (existingCall) {
      return res.status(400).json({ error: 'Bu masadan zaten bekleyen bir çağrı var' });
    }
    
    // Yeni çağrı oluştur
    db.run('INSERT INTO waiter_calls (table_id, status) VALUES (?, "pending")', 
      [table_id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      
      res.json({ 
        id: this.lastID, 
        message: 'Garson çağrısı oluşturuldu',
        table_id: table_id
      });
    });
  });
});

// Garson çağrısı durumunu güncelle
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'in_progress', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Geçersiz durum' });
  }
  
  const resolvedAt = status === 'resolved' ? 'CURRENT_TIMESTAMP' : 'NULL';
  
  db.run(`
    UPDATE waiter_calls 
    SET status = ?, resolved_at = ${resolvedAt}
    WHERE id = ?
  `, [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Garson çağrısı bulunamadı' });
    }
    res.json({ message: 'Garson çağrısı durumu güncellendi' });
  });
});

// Garson çağrısı sil
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM waiter_calls WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Garson çağrısı bulunamadı' });
    }
    res.json({ message: 'Garson çağrısı silindi' });
  });
});

// Masaya göre garson çağrılarını getir
router.get('/table/:tableId', (req, res) => {
  const { tableId } = req.params;
  
  db.all(`
    SELECT wc.*, t.table_number
    FROM waiter_calls wc
    LEFT JOIN tables t ON wc.table_id = t.id
    WHERE wc.table_id = ?
    ORDER BY wc.created_at DESC
  `, [tableId], (err, calls) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(calls);
  });
});

// Tüm bekleyen çağrıları çöz
router.put('/resolve-all', (req, res) => {
  db.run(`
    UPDATE waiter_calls 
    SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
    WHERE status = 'pending'
  `, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json({ 
      message: `${this.changes} garson çağrısı çözüldü`,
      resolved_count: this.changes
    });
  });
});

module.exports = router; 