const orderHandler = require('./orderHandler');
const waiterHandler = require('./waiterHandler');

function socketManager(io) {
  console.log('WebSocket yöneticisi başlatıldı');

  io.on('connection', (socket) => {
    console.log('Yeni WebSocket bağlantısı:', socket.id);

    // Admin paneli bağlantısı
    socket.on('admin-connect', () => {
      socket.join('admin');
      console.log('Admin paneli bağlandı');
    });

    // Masa bağlantısı
    socket.on('table-connect', (tableId) => {
      socket.join(`table-${tableId}`);
      console.log(`Masa ${tableId} bağlandı`);
    });

    // Sipariş olayları
    socket.on('new-order', (orderData) => {
      orderHandler.handleNewOrder(io, orderData);
    });

    socket.on('order-status-update', (orderData) => {
      orderHandler.handleStatusUpdate(io, orderData);
    });

    // Garson çağrı olayları
    socket.on('waiter-call', (callData) => {
      waiterHandler.handleWaiterCall(io, callData);
    });

    socket.on('waiter-call-resolved', (callData) => {
      waiterHandler.handleCallResolved(io, callData);
    });

    // Bağlantı kesildiğinde
    socket.on('disconnect', () => {
      console.log('WebSocket bağlantısı kesildi:', socket.id);
    });
  });

  // Global fonksiyonlar
  io.sendNotification = (type, data) => {
    io.to('admin').emit('notification', { type, data });
  };

  io.sendOrderUpdate = (tableId, orderData) => {
    io.to(`table-${tableId}`).emit('order-update', orderData);
  };

  io.sendWaiterCallUpdate = (tableId, callData) => {
    io.to(`table-${tableId}`).emit('waiter-call-update', callData);
  };

  return io;
}

module.exports = socketManager; 