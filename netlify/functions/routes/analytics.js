const express = require('express');
const { query, get } = require('../utils/database');
const router = express.Router();

// Genel istatistikler
router.get('/overview', async (req, res) => {
  try {
    // Toplam sipariş sayısı
    const totalOrders = await get('SELECT COUNT(*) as count FROM orders');
    
    // Bugünkü sipariş sayısı
    const todayOrders = await get('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE("now")');
    
    // Toplam gelir
    const totalRevenue = await get('SELECT SUM(total_amount) as total FROM orders WHERE status = "served"');
    
    // Bugünkü gelir
    const todayRevenue = await get('SELECT SUM(total_amount) as total FROM orders WHERE status = "served" AND DATE(created_at) = DATE("now")');
    
    // Bekleyen sipariş sayısı
    const pendingOrders = await get('SELECT COUNT(*) as count FROM orders WHERE status IN ("pending", "preparing", "ready")');
    
    // Bekleyen garson çağrısı sayısı
    const pendingCalls = await get('SELECT COUNT(*) as count FROM waiter_calls WHERE status = "pending"');
    
    // Toplam masa sayısı
    const totalTables = await get('SELECT COUNT(*) as count FROM tables');
    
    // Dolu masa sayısı
    const occupiedTables = await get('SELECT COUNT(*) as count FROM tables WHERE status = "occupied"');

    res.json({
      total_orders: totalOrders.count,
      today_orders: todayOrders.count,
      total_revenue: totalRevenue.total || 0,
      today_revenue: todayRevenue.total || 0,
      pending_orders: pendingOrders.count,
      pending_calls: pendingCalls.count,
      total_tables: totalTables.count,
      occupied_tables: occupiedTables.count
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
    
    const sales = await query(sql);
    res.json(sales);
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
    
    const items = await query(sql, [limit]);
    res.json(items);
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
    
    const sales = await query(sql);
    res.json(sales);
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
        t.table_number,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND o.status = 'served'
      GROUP BY t.id, t.table_number
      ORDER BY total_revenue DESC
    `;
    
    const performance = await query(sql);
    res.json(performance);
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
    
    const distribution = await query(sql);
    res.json(distribution);
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
    
    const distribution = await query(sql);
    res.json(distribution);
  } catch (error) {
    console.error('Order status distribution error:', error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});

module.exports = router; 