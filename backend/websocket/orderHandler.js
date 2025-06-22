function handleNewOrder(io, orderData) {
  console.log('Yeni sipariş alındı:', orderData);
  
  // Admin paneline bildirim gönder
  io.to('admin').emit('new-order', {
    type: 'new-order',
    data: orderData,
    timestamp: new Date().toISOString()
  });
  
  // Ses bildirimi için
  io.to('admin').emit('sound-alert', {
    type: 'new-order',
    sound: 'notification.mp3'
  });
}

function handleStatusUpdate(io, orderData) {
  console.log('Sipariş durumu güncellendi:', orderData);
  
  const { orderId, tableId, status, items } = orderData;
  
  // Admin paneline güncelleme gönder
  io.to('admin').emit('order-update', {
    type: 'status-update',
    orderId,
    tableId,
    status,
    items,
    timestamp: new Date().toISOString()
  });
  
  // Masaya güncelleme gönder
  io.to(`table-${tableId}`).emit('order-status-update', {
    orderId,
    status,
    items,
    timestamp: new Date().toISOString()
  });
  
  // Sipariş hazır olduğunda özel bildirim
  if (status === 'ready') {
    io.to('admin').emit('sound-alert', {
      type: 'order-ready',
      sound: 'ready.mp3'
    });
    
    io.to(`table-${tableId}`).emit('order-ready', {
      orderId,
      items,
      message: 'Siparişiniz hazır!'
    });
  }
}

module.exports = {
  handleNewOrder,
  handleStatusUpdate
}; 