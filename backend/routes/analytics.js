const express = require('express');
const db = require('../utils/database');
const router = express.Router();

// Günlük satış raporu
router.get('/daily-sales', (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const query = `
    SELECT 
      DATE(o.created_at) as date,
      COUNT(o.id) as total_orders,
      SUM(o.total_amount) as total_revenue,
      AVG(o.total_amount) as avg_order_value
    FROM orders o
    WHERE DATE(o.created_at) = ?
    GROUP BY DATE(o.created_at)
  `;
  
  db.get(query, [targetDate], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(result || { date: targetDate, total_orders: 0, total_revenue: 0, avg_order_value: 0 });
  });
});

// Haftalık satış raporu
router.get('/weekly-sales', (req, res) => {
  const query = `
    SELECT 
      DATE(o.created_at) as date,
      COUNT(o.id) as total_orders,
      SUM(o.total_amount) as total_revenue
    FROM orders o
    WHERE o.created_at >= date('now', '-7 days')
    GROUP BY DATE(o.created_at)
    ORDER BY date DESC
  `;
  
  db.all(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(results);
  });
});

// En popüler menü öğeleri
router.get('/popular-items', (req, res) => {
  const { limit = 10 } = req.query;
  
  const query = `
    SELECT 
      mi.name,
      mi.price,
      SUM(oi.quantity) as total_ordered,
      SUM(oi.quantity * oi.price) as total_revenue
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= date('now', '-30 days')
    GROUP BY mi.id, mi.name, mi.price
    ORDER BY total_ordered DESC
    LIMIT ?
  `;
  
  db.all(query, [limit], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(results);
  });
});

// Kategori bazında satışlar
router.get('/category-sales', (req, res) => {
  const query = `
    SELECT 
      c.name as category_name,
      COUNT(DISTINCT o.id) as total_orders,
      SUM(oi.quantity) as total_items,
      SUM(oi.quantity * oi.price) as total_revenue
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    JOIN categories c ON mi.category_id = c.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= date('now', '-30 days')
    GROUP BY c.id, c.name
    ORDER BY total_revenue DESC
  `;
  
  db.all(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(results);
  });
});

// Masa performansı
router.get('/table-performance', (req, res) => {
  const query = `
    SELECT 
      t.table_number,
      COUNT(o.id) as total_orders,
      SUM(o.total_amount) as total_revenue,
      AVG(o.total_amount) as avg_order_value
    FROM tables t
    LEFT JOIN orders o ON t.id = o.table_id
    WHERE o.created_at >= date('now', '-30 days')
    GROUP BY t.id, t.table_number
    ORDER BY total_revenue DESC
  `;
  
  db.all(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(results);
  });
});

// Sipariş durumu istatistikleri
router.get('/order-status', (req, res) => {
  const query = `
    SELECT 
      status,
      COUNT(*) as count,
      SUM(total_amount) as total_revenue
    FROM orders
    WHERE created_at >= date('now', '-7 days')
    GROUP BY status
  `;
  
  db.all(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(results);
  });
});

// Garson çağrı istatistikleri
router.get('/waiter-calls', (req, res) => {
  const query = `
    SELECT 
      status,
      COUNT(*) as count,
      AVG(CAST((julianday(resolved_at) - julianday(created_at)) * 24 * 60 AS INTEGER)) as avg_resolution_time_minutes
    FROM waiter_calls
    WHERE created_at >= date('now', '-7 days')
    GROUP BY status
  `;
  
  db.all(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(results);
  });
});

// Saatlik sipariş dağılımı
router.get('/hourly-distribution', (req, res) => {
  const query = `
    SELECT 
      strftime('%H', created_at) as hour,
      COUNT(*) as order_count,
      SUM(total_amount) as total_revenue
    FROM orders
    WHERE created_at >= date('now', '-7 days')
    GROUP BY strftime('%H', created_at)
    ORDER BY hour
  `;
  
  db.all(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(results);
  });
});

module.exports = router; 