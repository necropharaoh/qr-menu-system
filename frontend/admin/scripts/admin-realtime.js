// Admin Panel Gerçek Zamanlı Güncelleme Sistemi
class AdminRealTimeUpdates {
  constructor() {
    this.pollingInterval = null;
    this.lastOrderUpdate = null;
    this.lastCallUpdate = null;
    this.isConnected = false;
    this.init();
  }

  init() {
    this.startPolling();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Sayfa görünürlüğü değiştiğinde polling'i kontrol et
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopPolling();
      } else {
        this.startPolling();
      }
    });

    // Sayfa kapatılırken polling'i durdur
    window.addEventListener('beforeunload', () => {
      this.stopPolling();
    });
  }

  startPolling() {
    if (this.pollingInterval) {
      return; // Zaten çalışıyor
    }

    this.isConnected = true;
    this.pollingInterval = setInterval(() => {
      this.checkForUpdates();
    }, 2000); // 2 saniyede bir kontrol et

    console.log('Admin gerçek zamanlı güncellemeler başlatıldı');
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isConnected = false;
      console.log('Admin gerçek zamanlı güncellemeler durduruldu');
    }
  }

  async checkForUpdates() {
    try {
      // Yeni siparişleri kontrol et
      await this.checkNewOrders();
      
      // Yeni garson çağrılarını kontrol et
      await this.checkNewWaiterCalls();
      
    } catch (error) {
      console.error('Admin güncelleme kontrolü hatası:', error);
    }
  }

  async checkNewOrders() {
    try {
      const orders = await API.get('/api/orders?limit=10');
      
      if (orders.length > 0) {
        const latestOrder = orders[0];
        
        if (!this.lastOrderUpdate || latestOrder.created_at > this.lastOrderUpdate) {
          this.lastOrderUpdate = latestOrder.created_at;
          this.handleNewOrder(latestOrder);
        }
      }
    } catch (error) {
      console.error('Yeni sipariş kontrolü hatası:', error);
    }
  }

  async checkNewWaiterCalls() {
    try {
      const calls = await API.get('/api/waiter/pending');
      
      if (calls.length > 0) {
        const latestCall = calls[0];
        
        if (!this.lastCallUpdate || latestCall.created_at > this.lastCallUpdate) {
          this.lastCallUpdate = latestCall.created_at;
          this.handleNewWaiterCall(latestCall);
        }
      }
    } catch (error) {
      console.error('Yeni garson çağrısı kontrolü hatası:', error);
    }
  }

  handleNewOrder(order) {
    // Yeni sipariş bildirimi
    const message = `Yeni sipariş! Masa ${order.number} - ${this.formatPrice(order.total_amount)}`;
    
    // Bildirim göster
    this.showNotification(message, 'order');
    
    // Ses çal
    this.playSound('notification');
    
    // Dashboard'u güncelle
    if (window.adminPanel && window.adminPanel.currentTab === 'orders') {
      window.adminPanel.loadOrders();
    }
  }

  handleNewWaiterCall(call) {
    // Yeni garson çağrısı bildirimi
    const message = `Garson çağrısı! Masa ${call.number}`;
    
    // Bildirim göster
    this.showNotification(message, 'waiter');
    
    // Ses çal
    this.playSound('notification');
  }

  showNotification(message, type) {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('QR Menü Sistemi', {
        body: message,
        icon: '/favicon.ico',
        tag: type
      });
    }

    // Toast bildirimi
    this.showToast(message, 'info');
    
    // Bildirim sayacını güncelle
    this.updateNotificationCount(type);
  }

  updateNotificationCount(type) {
    const orderCountElement = document.getElementById('pendingOrders');
    const callCountElement = document.getElementById('pendingCalls');
    
    if (type === 'order' && orderCountElement) {
      const currentCount = parseInt(orderCountElement.textContent) || 0;
      orderCountElement.textContent = currentCount + 1;
      orderCountElement.classList.add('pulse');
      
      setTimeout(() => {
        orderCountElement.classList.remove('pulse');
      }, 2000);
    }
    
    if (type === 'waiter' && callCountElement) {
      const currentCount = parseInt(callCountElement.textContent) || 0;
      callCountElement.textContent = currentCount + 1;
      callCountElement.classList.add('pulse');
      
      setTimeout(() => {
        callCountElement.classList.remove('pulse');
      }, 2000);
    }
  }

  // Manuel güncelleme tetikleme
  triggerUpdate() {
    this.checkForUpdates();
  }

  // Bağlantı durumunu kontrol et
  getConnectionStatus() {
    return this.isConnected;
  }

  // Polling aralığını değiştir
  setPollingInterval(interval) {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.checkForUpdates();
    }, interval);
  }

  // Notification izni iste
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Bildirim izni verildi');
        }
      });
    }
  }

  // Yardımcı fonksiyonlar
  formatPrice(price) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  playSound(soundType = 'notification') {
    try {
      const audio = new Audio();
      
      switch (soundType) {
        case 'notification':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
          break;
        case 'success':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
          break;
        case 'error':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
          break;
      }
      
      audio.play().catch(e => console.log('Ses çalınamadı:', e));
    } catch (error) {
      console.log('Ses çalma hatası:', error);
    }
  }
}

// Global değişken olarak başlat
window.adminRealTimeUpdates = new AdminRealTimeUpdates();

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
  if (window.adminRealTimeUpdates) {
    window.adminRealTimeUpdates.startPolling();
    window.adminRealTimeUpdates.requestNotificationPermission();
  }
}); 