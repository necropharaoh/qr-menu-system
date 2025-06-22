function handleWaiterCall(io, callData) {
  console.log('Garson çağrısı alındı:', callData);
  
  const { tableId, tableNumber } = callData;
  
  // Admin paneline bildirim gönder
  io.to('admin').emit('waiter-call', {
    type: 'waiter-call',
    tableId,
    tableNumber,
    timestamp: new Date().toISOString()
  });
  
  // Ses bildirimi için
  io.to('admin').emit('sound-alert', {
    type: 'waiter-call',
    sound: 'waiter-call.mp3'
  });
  
  // Masaya onay gönder
  io.to(`table-${tableId}`).emit('waiter-call-confirmed', {
    message: 'Garson çağrınız alındı, en kısa sürede gelecek.',
    timestamp: new Date().toISOString()
  });
}

function handleCallResolved(io, callData) {
  console.log('Garson çağrısı çözüldü:', callData);
  
  const { tableId, tableNumber } = callData;
  
  // Admin paneline güncelleme gönder
  io.to('admin').emit('waiter-call-resolved', {
    type: 'waiter-call-resolved',
    tableId,
    tableNumber,
    timestamp: new Date().toISOString()
  });
  
  // Masaya bilgi gönder
  io.to(`table-${tableId}`).emit('waiter-call-resolved', {
    message: 'Garson çağrınız çözüldü.',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  handleWaiterCall,
  handleCallResolved
}; 