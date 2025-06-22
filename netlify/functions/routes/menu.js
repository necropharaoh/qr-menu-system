const express = require('express');
const { query, get, run } = require('../utils/database');
const router = express.Router();

// Tüm kategorileri getir
router.get('/categories', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories WHERE active = 1 ORDER BY sort_order, name');
    res.json(categories);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Kategori ekle
router.post('/categories', async (req, res) => {
  try {
    const { name, description, image, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Kategori adı gerekli' });
    }

    const result = await run(
      'INSERT INTO categories (name, description, image, sort_order) VALUES (?, ?, ?, ?)',
      [name, description, image, sort_order || 0]
    );

    res.json({ id: result.id, message: 'Kategori eklendi' });
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Kategori güncelle
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, sort_order, active } = req.body;

    const result = await run(
      'UPDATE categories SET name = ?, description = ?, image = ?, sort_order = ?, active = ? WHERE id = ?',
      [name, description, image, sort_order, active, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }

    res.json({ message: 'Kategori güncellendi' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Kategori sil
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await run('DELETE FROM categories WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }

    res.json({ message: 'Kategori silindi' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Tüm menü öğelerini getir
router.get('/items', async (req, res) => {
  try {
    const query = `
      SELECT mi.*, c.name as category_name 
      FROM menu_items mi 
      LEFT JOIN categories c ON mi.category_id = c.id 
      WHERE mi.available = 1 
      ORDER BY c.sort_order, mi.sort_order, mi.name
    `;
    
    const items = await query(query);
    res.json(items);
  } catch (error) {
    console.error('Menu items error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Kategoriye göre menü öğelerini getir
router.get('/items/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const items = await query(
      'SELECT * FROM menu_items WHERE category_id = ? AND available = 1 ORDER BY sort_order, name',
      [categoryId]
    );

    res.json(items);
  } catch (error) {
    console.error('Category items error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Menü öğesi ekle
router.post('/items', async (req, res) => {
  try {
    const { category_id, name, description, price, image, sort_order } = req.body;

    if (!name || !price || !category_id) {
      return res.status(400).json({ error: 'Ad, fiyat ve kategori gerekli' });
    }

    const result = await run(
      'INSERT INTO menu_items (category_id, name, description, price, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, name, description, price, image, sort_order || 0]
    );

    res.json({ id: result.id, message: 'Menü öğesi eklendi' });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Menü öğesi güncelle
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, image, sort_order, available } = req.body;

    const result = await run(
      'UPDATE menu_items SET category_id = ?, name = ?, description = ?, price = ?, image = ?, sort_order = ?, available = ? WHERE id = ?',
      [category_id, name, description, price, image, sort_order, available, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Menü öğesi bulunamadı' });
    }

    res.json({ message: 'Menü öğesi güncellendi' });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Menü öğesi sil
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await run('DELETE FROM menu_items WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Menü öğesi bulunamadı' });
    }

    res.json({ message: 'Menü öğesi silindi' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 