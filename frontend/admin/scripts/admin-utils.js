// Admin Panel Utils
console.log('Admin utils yükleniyor...');

const API_BASE_URL = '/.netlify/functions/api';

// API istekleri için yardımcı fonksiyonlar
class API {
  static baseURL = '/.netlify/functions/api';

  static async request(endpoint, options = {}) {
    console.log('API isteği gönderiliyor:', endpoint, options);
    
    const url = `${this.baseURL}${endpoint}`;
    console.log('Tam URL:', url);
    
    const token = localStorage.getItem('adminToken');
    console.log('Token mevcut:', token ? 'var' : 'yok');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    console.log('Request config:', config);

    try {
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  static async get(endpoint) {
    console.log('GET isteği:', endpoint);
    return this.request(endpoint, { method: 'GET' });
  }

  static async post(endpoint, data) {
    console.log('POST isteği:', endpoint, data);
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async put(endpoint, data) {
    console.log('PUT isteği:', endpoint, data);
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async delete(endpoint) {
    console.log('DELETE isteği:', endpoint);
    return this.request(endpoint, { method: 'DELETE' });
  }
}

console.log('API sınıfı tanımlandı:', API);

// Local Storage yardımcı fonksiyonları
class Storage {
  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  }

  static clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
}

// Para formatı
function formatPrice(price) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(price);
}

// Tarih formatı
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Toast bildirimi
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Ses çal
function playSound(soundType = 'notification') {
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

// Gerçek zamanlı güncelleme için polling
class RealtimeManager {
  constructor() {
    console.log('RealtimeManager başlatılıyor...');
    this.pollingInterval = null;
    this.isPolling = false;
    this.lastOrderId = 0;
    this.lastUpdateTime = Date.now();
  }

  startPolling() {
    console.log('Polling başlatılıyor...');
    if (this.isPolling) {
      console.log('Polling zaten aktif');
      return;
    }

    this.isPolling = true;
    this.pollingInterval = setInterval(() => {
      this.checkForUpdates();
    }, 5000); // 5 saniyede bir kontrol et

    console.log('Polling başlatıldı');
  }

  stopPolling() {
    console.log('Polling durduruluyor...');
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('Polling durduruldu');
  }

  async checkForUpdates() {
    try {
      console.log('Güncellemeler kontrol ediliyor...');
      const response = await API.get(`/orders/updates?since=${this.lastUpdateTime}`);
      
      if (response.hasUpdates) {
        console.log('Yeni güncellemeler var:', response);
        this.lastUpdateTime = Date.now();
        
        // Admin panelini güncelle
        if (window.adminPanel && window.adminPanel.currentTab === 'orders') {
          console.log('Siparişler yenileniyor...');
          window.adminPanel.loadOrders();
        }
        
        // Bildirim göster
        this.showNotification('Yeni sipariş veya güncelleme var!');
      }
    } catch (error) {
      console.error('Güncelleme kontrolü hatası:', error);
    }
  }

  showNotification(message) {
    console.log('Bildirim gösteriliyor:', message);
    
    // Tarayıcı bildirimi
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('QR Menü Sistemi', {
        body: message,
        icon: '/favicon.ico'
      });
    }
    
    // Toast bildirimi
    if (window.adminPanel) {
      window.adminPanel.showToast(message, 'info');
    }
  }

  requestNotificationPermission() {
    console.log('Bildirim izni isteniyor...');
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Bildirim izni:', permission);
      });
    }
  }
}

console.log('RealtimeManager sınıfı tanımlandı');

// Global değişkenler
window.API = API;
window.Storage = Storage;
window.RealtimeManager = RealtimeManager;
window.Utils = {
  formatPrice,
  formatDate,
  showToast,
  playSound
};

console.log('Admin utils yüklendi, global değişkenler ayarlandı'); 