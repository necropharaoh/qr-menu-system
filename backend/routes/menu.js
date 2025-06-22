const express = require('express');
const db = require('../utils/database');
const router = express.Router();

// Tüm kategorileri getir
router.get('/categories', (req, res) => {
  db.all('SELECT * FROM categories WHERE active = 1 ORDER BY sort_order, name', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(categories);
  });
});

// Kategori ekle
router.post('/categories', (req, res) => {
  const { name, description, image, sort_order } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Kategori adı gerekli' });
  }

  db.run(
    'INSERT INTO categories (name, description, image, sort_order) VALUES (?, ?, ?, ?)',
    [name, description, image, sort_order || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      res.json({ id: this.lastID, message: 'Kategori eklendi' });
    }
  );
});

// Kategori güncelle
router.put('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, image, sort_order, active } = req.body;

  db.run(
    'UPDATE categories SET name = ?, description = ?, image = ?, sort_order = ?, active = ? WHERE id = ?',
    [name, description, image, sort_order, active, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Kategori bulunamadı' });
      }
      res.json({ message: 'Kategori güncellendi' });
    }
  );
});

// Kategori sil
router.delete('/categories/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }
    res.json({ message: 'Kategori silindi' });
  });
});

// Tüm menü öğelerini getir
router.get('/items', (req, res) => {
  const query = `
    SELECT mi.*, c.name as category_name 
    FROM menu_items mi 
    LEFT JOIN categories c ON mi.category_id = c.id 
    WHERE mi.available = 1 
    ORDER BY c.sort_order, mi.sort_order, mi.name
  `;
  
  db.all(query, (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(items);
  });
});

// Kategoriye göre menü öğelerini getir
router.get('/items/category/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  
  db.all(
    'SELECT * FROM menu_items WHERE category_id = ? AND available = 1 ORDER BY sort_order, name',
    [categoryId],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      res.json(items);
    }
  );
});

// Menü öğesi ekle
router.post('/items', (req, res) => {
  const { category_id, name, description, price, image, sort_order } = req.body;

  if (!name || !price || !category_id) {
    return res.status(400).json({ error: 'Ad, fiyat ve kategori gerekli' });
  }

  db.run(
    'INSERT INTO menu_items (category_id, name, description, price, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    [category_id, name, description, price, image, sort_order || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      res.json({ id: this.lastID, message: 'Menü öğesi eklendi' });
    }
  );
});

// Menü öğesi güncelle
router.put('/items/:id', (req, res) => {
  const { id } = req.params;
  const { category_id, name, description, price, image, sort_order, available } = req.body;

  db.run(
    'UPDATE menu_items SET category_id = ?, name = ?, description = ?, price = ?, image = ?, sort_order = ?, available = ? WHERE id = ?',
    [category_id, name, description, price, image, sort_order, available, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Menü öğesi bulunamadı' });
      }
      res.json({ message: 'Menü öğesi güncellendi' });
    }
  );
});

// Menü öğesi sil
router.delete('/items/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM menu_items WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Menü öğesi bulunamadı' });
    }
    res.json({ message: 'Menü öğesi silindi' });
  });
});

module.exports = router; 