const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // IP başına maksimum istek
});
app.use(limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/restaurant', require('./routes/restaurant'));
app.use('/api/waiter', require('./routes/waiter'));

// WebSocket bağlantıları
const socketManager = require('./websocket/socketManager');
socketManager(io);

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Admin paneli
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin/admin.html'));
});

// QR menü sayfası
app.get('/menu/:tableId', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/menu/customer.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Sayfa bulunamadı' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Sunucu hatası' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`Admin paneli: http://localhost:${PORT}/admin`);
  console.log(`QR menü örneği: http://localhost:${PORT}/menu/1`);
}); 