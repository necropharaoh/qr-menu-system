const express = require('express');
const pool = require('../utils/database');
const router = express.Router();

// Genel istatistikler
router.get('/overview', async (req, res) => {
  try {
    const totalOrders = await pool.query('SELECT COUNT(*) as count FROM orders');
    const todayOrders = await pool.query('SELECT COUNT(*) as count FROM orders WHERE created_at::date = CURRENT_DATE');
    const totalRevenue = await pool.query("SELECT SUM(total_amount) as total FROM orders WHERE status = 'served'");
    const todayRevenue = await pool.query("SELECT SUM(total_amount) as total FROM orders WHERE status = 'served' AND created_at::date = CURRENT_DATE");
    const pendingOrders = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'preparing', 'ready')");
    const pendingCalls = await pool.query("SELECT COUNT(*) as count FROM waiter_calls WHERE status = 'pending'");
    const totalTables = await pool.query('SELECT COUNT(*) as count FROM tables');
    const occupiedTables = await pool.query("SELECT COUNT(*) as count FROM tables WHERE status = 'occupied'");
    res.json({
      total_orders: totalOrders.rows[0].count,
      today_orders: todayOrders.rows[0].count,
      total_revenue: totalRevenue.rows[0].total || 0,
      today_revenue: todayRevenue.rows[0].total || 0,
      pending_orders: pendingOrders.rows[0].count,
      pending_calls: pendingCalls.rows[0].count,
      total_tables: totalTables.rows[0].count,
      occupied_tables: occupiedTables.rows[0].count
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Günlük satış raporu
router.get('/daily-sales', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue
      FROM orders 
      WHERE status = 'served' 
        AND created_at >= DATE('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const sales = await pool.query(sql);
    res.json(sales.rows);
  } catch (error) {
    console.error('Daily sales error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// En popüler menü öğeleri
router.get('/popular-items', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const sql = `
      SELECT 
        mi.name,
        mi.price,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'served'
      GROUP BY mi.id, mi.name, mi.price
      ORDER BY total_quantity DESC
      LIMIT ?
    `;
    
    const items = await pool.query(sql, [limit]);
    res.json(items.rows);
  } catch (error) {
    console.error('Popular items error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Kategori bazında satış
router.get('/category-sales', async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN categories c ON mi.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'served'
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `;
    
    const sales = await pool.query(sql);
    res.json(sales.rows);
  } catch (error) {
    console.error('Category sales error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Masa performansı
router.get('/table-performance', async (req, res) => {
  try {
    const sql = `
      SELECT 
        t.number,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND o.status = 'served'
      GROUP BY t.id, t.number
      ORDER BY total_revenue DESC
    `;
    
    const performance = await pool.query(sql);
    res.json(performance.rows);
  } catch (error) {
    console.error('Table performance error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Saatlik sipariş dağılımı
router.get('/hourly-distribution', async (req, res) => {
  try {
    const sql = `
      SELECT 
        strftime('%H', created_at) as hour,
        COUNT(*) as order_count
      FROM orders 
      WHERE status = 'served'
        AND created_at >= DATE('now', '-7 days')
      GROUP BY strftime('%H', created_at)
      ORDER BY hour
    `;
    
    const distribution = await pool.query(sql);
    res.json(distribution.rows);
  } catch (error) {
    console.error('Hourly distribution error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

// Sipariş durumu dağılımı
router.get('/order-status-distribution', async (req, res) => {
  try {
    const sql = `
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      GROUP BY status
    `;
    
    const distribution = await pool.query(sql);
    res.json(distribution.rows);
  } catch (error) {
    console.error('Order status distribution error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 