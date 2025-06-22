const express = require('express');
const pool = require('../utils/database');
const router = express.Router();

// Tüm kategorileri getir
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE status = $1 ORDER BY name', ['active']);
    res.json(result.rows);
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

    const result = await pool.query(
      'INSERT INTO categories (name, description, image, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, description, image, sort_order || 0]
    );

    res.json({ id: result.rows[0].id, message: 'Kategori eklendi' });
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

    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2, image = $3, sort_order = $4, active = $5 WHERE id = $6 RETURNING *',
      [name, description, image, sort_order, active, id]
    );

    if (result.rows.length === 0) {
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

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
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
    const result = await pool.query(`
      SELECT mi.*, c.name as category_name 
      FROM menu_items mi 
      LEFT JOIN categories c ON mi.category_id = c.id 
      WHERE mi.status = $1 
      ORDER BY c.name, mi.name
    `, ['available']);
    res.json(result.rows);
  } catch (error) {
    console.error('Menu items error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Kategoriye göre menü öğelerini getir
router.get('/items/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE category_id = $1 AND status = $2 ORDER BY name',
      [categoryId, 'available']
    );
    res.json(result.rows);
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

    const result = await pool.query(
      'INSERT INTO menu_items (category_id, name, description, price, image, sort_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [category_id, name, description, price, image, sort_order || 0]
    );

    res.json({ id: result.rows[0].id, message: 'Menü öğesi eklendi' });
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

    const result = await pool.query(
      'UPDATE menu_items SET category_id = $1, name = $2, description = $3, price = $4, image = $5, sort_order = $6, available = $7 WHERE id = $8 RETURNING *',
      [category_id, name, description, price, image, sort_order, available, id]
    );

    if (result.rows.length === 0) {
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

    const result = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menü öğesi bulunamadı' });
    }

    res.json({ message: 'Menü öğesi silindi' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 