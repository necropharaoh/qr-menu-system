// Admin Panel JavaScript
class AdminPanel {
  constructor() {
    this.currentTab = 'orders';
    console.log('AdminPanel constructor çalıştı');
    this.init();
  }

  init() {
    console.log('AdminPanel init çalıştı');
    this.setupEventListeners();
    this.checkAuth();
  }

  setupEventListeners() {
    console.log('Event listeners kuruluyor...');
    
    // Login form
    const loginForm = document.getElementById('login-form');
    console.log('Login form bulundu:', loginForm);
    
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        console.log('Login form submit edildi');
        e.preventDefault();
        this.login();
      });
    } else {
      console.error('Login form bulunamadı!');
    }

    // Tab değiştirme
    document.querySelectorAll('.nav-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const tab = e.target.closest('.nav-btn').dataset.tab;
        this.switchTab(tab);
      });
    });

    // Çıkış yapma
    const logoutBtn = document.querySelector('.btn-secondary');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  async login() {
    console.log('Login fonksiyonu çalıştı');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');

    console.log('Giriş bilgileri:', { username, password: password ? '***' : 'boş' });

    if (!username || !password) {
      this.showLoginError('Kullanıcı adı ve şifre gerekli');
      return;
    }

    try {
      console.log('API isteği gönderiliyor...');
      const response = await API.post('/api/auth/login', { username, password });
      console.log('API yanıtı:', response);
      
      // Token'ı localStorage'a kaydet
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminUser', JSON.stringify(response.user));
      
      console.log('Token kaydedildi, dashboard gösteriliyor...');
      
      // Dashboard'u göster
      this.showDashboard();
      
      // İlk tab'ı yükle
      this.loadOrders();
      
    } catch (error) {
      console.error('Login error:', error);
      this.showLoginError('Giriş başarısız. Kullanıcı adı veya şifre hatalı.');
    }
  }

  showLoginError(message) {
    console.log('Login hatası gösteriliyor:', message);
    const errorElement = document.getElementById('login-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  async checkAuth() {
    console.log('Auth kontrolü yapılıyor...');
    const token = localStorage.getItem('adminToken');
    console.log('Mevcut token:', token ? 'var' : 'yok');
    
    if (!token) {
      console.log('Token yok, login ekranı gösteriliyor');
      this.showLoginScreen();
      return;
    }

    try {
      console.log('Token doğrulama isteği gönderiliyor...');
      const response = await API.get('/api/auth/verify');
      console.log('Token doğrulama yanıtı:', response);
      
      if (!response.valid) {
        console.log('Token geçersiz, logout yapılıyor');
        this.logout();
      } else {
        console.log('Token geçerli, dashboard gösteriliyor');
        this.showDashboard();
        this.loadOrders();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      this.logout();
    }
  }

  showLoginScreen() {
    console.log('Login ekranı gösteriliyor');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
  }

  showDashboard() {
    console.log('Dashboard gösteriliyor');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Kullanıcı bilgisini göster
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const currentUserElement = document.getElementById('current-user');
    if (currentUserElement) {
      currentUserElement.textContent = user.username || 'Admin';
    }
  }

  logout() {
    console.log('Logout yapılıyor');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    this.showLoginScreen();
  }

  switchTab(tab) {
    console.log('Tab değiştiriliyor:', tab);
    
    // Aktif tab'ı güncelle
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Tab içeriğini güncelle
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');

    this.currentTab = tab;

    // Tab'a göre veri yükle
    switch (tab) {
      case 'orders':
        this.loadOrders();
        break;
      case 'tables':
        this.loadTables();
        break;
      case 'menu':
        this.loadMenu();
        break;
      case 'analytics':
        this.loadAnalytics();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  }

  async loadOrders() {
    console.log('Siparişler yükleniyor...');
    try {
      const orders = await API.get('/api/orders');
      console.log('Siparişler yüklendi:', orders);
      this.updateOrdersUI(orders);
    } catch (error) {
      console.error('Siparişler yükleme hatası:', error);
      this.showToast('Siparişler yüklenirken hata oluştu', 'error');
    }
  }

  updateOrdersUI(orders) {
    const ordersContainer = document.getElementById('orders-container');
    if (ordersContainer) {
      ordersContainer.innerHTML = orders.map(order => `
        <div class="order-item" data-id="${order.id}">
          <div class="order-header">
            <span class="order-number">#${order.id}</span>
            <span class="table-number">Masa ${order.number}</span>
            <span class="order-time">${this.formatDate(order.created_at)}</span>
          </div>
          <div class="order-items">${order.items || ''}</div>
          <div class="order-footer">
            <span class="order-amount">${this.formatPrice(order.total_amount)}</span>
            <div class="order-actions">
              <select onchange="adminPanel.updateOrderStatus(${order.id}, this.value)" class="status-select">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Bekliyor</option>
                <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Hazırlanıyor</option>
                <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Hazır</option>
                <option value="served" ${order.status === 'served' ? 'selected' : ''}>Servis Edildi</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>İptal</option>
              </select>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  async loadTables() {
    try {
      const tables = await API.get('/api/tables');
      this.updateTablesUI(tables);
    } catch (error) {
      console.error('Masalar yükleme hatası:', error);
      this.showToast('Masalar yüklenirken hata oluştu', 'error');
    }
  }

  updateTablesUI(tables) {
    const tablesContainer = document.getElementById('tables-container');
    if (tablesContainer) {
      tablesContainer.innerHTML = tables.map(table => `
        <div class="table-item" data-id="${table.id}">
          <div class="table-info">
            <h4>Masa ${table.number}</h4>
            <span class="table-status ${table.status}">${this.getTableStatusText(table.status)}</span>
          </div>
          <div class="table-actions">
            <button onclick="adminPanel.showEditTableModal(${JSON.stringify(table).replace(/"/g, '&quot;')})" class="btn btn-sm btn-primary">Düzenle</button>
            <button onclick="adminPanel.generateQR(${table.id})" class="btn btn-sm btn-secondary">QR Kod</button>
            <button onclick="adminPanel.deleteTable(${table.id})" class="btn btn-sm btn-danger">Sil</button>
          </div>
        </div>
      `).join('');
    }
  }

  async loadMenu() {
    try {
      const [categories, items] = await Promise.all([
        API.get('/api/menu/categories'),
        API.get('/api/menu/items')
      ]);

      this.updateMenuUI(categories, items);
    } catch (error) {
      console.error('Menü yükleme hatası:', error);
      this.showToast('Menü yüklenirken hata oluştu', 'error');
    }
  }

  updateMenuUI(categories, items) {
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer) {
      menuContainer.innerHTML = `
        <div class="menu-section">
          <h3>Kategoriler</h3>
          <div class="categories-list">
            ${categories.map(category => `
              <div class="category-item" data-id="${category.id}">
                <div class="category-info">
                  <h4>${category.name}</h4>
                  <p>${category.description || ''}</p>
                </div>
                <div class="category-actions">
                  <button onclick="adminPanel.editCategory(${category.id})" class="btn btn-sm btn-primary">Düzenle</button>
                  <button onclick="adminPanel.deleteCategory(${category.id})" class="btn btn-sm btn-danger">Sil</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="menu-section">
          <h3>Menü Öğeleri</h3>
          <div class="menu-items-list">
            ${items.map(item => `
              <div class="menu-item" data-id="${item.id}">
                <div class="item-info">
                  <h4>${item.name}</h4>
                  <p>${item.description || ''}</p>
                  <span class="category-name">${item.category_name}</span>
                  <span class="price">${this.formatPrice(item.price)}</span>
                </div>
                <div class="item-actions">
                  <button onclick="adminPanel.editMenuItem(${item.id})" class="btn btn-sm btn-primary">Düzenle</button>
                  <button onclick="adminPanel.deleteMenuItem(${item.id})" class="btn btn-sm btn-danger">Sil</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  async loadAnalytics() {
    try {
      const [dailySales, popularItems] = await Promise.all([
        API.get('/api/analytics/daily-sales'),
        API.get('/api/analytics/popular-items')
      ]);

      this.updateAnalyticsUI(dailySales, popularItems);
    } catch (error) {
      console.error('Analitik yükleme hatası:', error);
      this.showToast('Analitik yüklenirken hata oluştu', 'error');
    }
  }

  updateAnalyticsUI(dailySales, popularItems) {
    const analyticsContainer = document.getElementById('analytics-container');
    if (analyticsContainer) {
      analyticsContainer.innerHTML = `
        <div class="analytics-section">
          <h3>Günlük Satışlar</h3>
          <div class="daily-sales-list">
            ${dailySales.map(sale => `
              <div class="sale-item">
                <span class="sale-date">${sale.date}</span>
                <span class="sale-count">${sale.order_count} sipariş</span>
                <span class="sale-revenue">${this.formatPrice(sale.total_revenue)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="analytics-section">
          <h3>Popüler Ürünler</h3>
          <div class="popular-items-list">
            ${popularItems.map(item => `
              <div class="popular-item">
                <span class="item-name">${item.name}</span>
                <span class="item-quantity">${item.total_quantity} adet</span>
                <span class="item-revenue">${this.formatPrice(item.total_revenue)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  async loadSettings() {
    try {
      const restaurant = await API.get('/api/restaurant');
      this.updateSettingsUI(restaurant);
    } catch (error) {
      console.error('Ayarlar yükleme hatası:', error);
      this.showToast('Ayarlar yüklenirken hata oluştu', 'error');
    }
  }

  updateSettingsUI(restaurant) {
    const settingsContainer = document.getElementById('settings-container');
    if (settingsContainer) {
      settingsContainer.innerHTML = `
        <form id="restaurant-settings-form" class="settings-form">
          <div class="form-group">
            <label for="restaurant-name">Restoran Adı</label>
            <input type="text" id="restaurant-name" value="${restaurant.name || ''}" required>
          </div>
          <div class="form-group">
            <label for="restaurant-address">Adres</label>
            <textarea id="restaurant-address">${restaurant.address || ''}</textarea>
          </div>
          <div class="form-group">
            <label for="restaurant-phone">Telefon</label>
            <input type="tel" id="restaurant-phone" value="${restaurant.phone || ''}">
          </div>
          <button type="submit" class="btn btn-primary">Kaydet</button>
        </form>
      `;

      // Form submit event listener
      const form = document.getElementById('restaurant-settings-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.saveRestaurantSettings();
        });
      }
    }
  }

  async saveRestaurantSettings() {
    const name = document.getElementById('restaurant-name').value;
    const address = document.getElementById('restaurant-address').value;
    const phone = document.getElementById('restaurant-phone').value;

    try {
      await API.put('/api/restaurant', { name, address, phone });
      this.showToast('Ayarlar kaydedildi', 'success');
    } catch (error) {
      console.error('Ayarlar kaydetme hatası:', error);
      this.showToast('Ayarlar kaydedilirken hata oluştu', 'error');
    }
  }

  // Diğer işlemler
  async updateOrderStatus(orderId, status) {
    try {
      await API.put(`/api/orders/${orderId}/status`, { status });
      this.showToast('Sipariş durumu güncellendi', 'success');
      this.loadOrders();
    } catch (error) {
      this.showToast('Sipariş durumu güncellenirken hata oluştu', 'error');
    }
  }

  // Yardımcı fonksiyonlar
  getTableStatusText(status) {
    const statusMap = {
      'available': 'Müsait',
      'occupied': 'Dolu',
      'reserved': 'Rezerve',
      'maintenance': 'Bakım'
    };
    return statusMap[status] || status;
  }

  formatPrice(price) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  showToast(message, type = 'info') {
    // Basit toast implementasyonu
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

  // Masa ekleme fonksiyonu
  showAddTableModal() {
    const modalBody = `
      <form id="add-table-form">
        <div class="form-group">
          <label for="add-table-number">Masa Numarası</label>
          <input type="number" id="add-table-number" required min="1">
        </div>
        <button type="submit" class="btn btn-primary">Ekle</button>
      </form>
    `;
    this.showModal('Masa Ekle', modalBody);
    document.getElementById('add-table-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const tableNumber = document.getElementById('add-table-number').value;
      try {
        await API.post('/api/tables', { number: tableNumber });
        this.showToast('Masa eklendi', 'success');
        this.closeModal();
        this.loadTables();
      } catch (error) {
        this.showToast('Masa eklenirken hata oluştu', 'error');
      }
    });
  }

  // Masa düzenleme fonksiyonu
  showEditTableModal(table) {
    const modalBody = `
      <form id="edit-table-form">
        <div class="form-group">
          <label for="edit-table-number">Masa Numarası</label>
          <input type="number" id="edit-table-number" value="${table.number}" required min="1">
        </div>
        <button type="submit" class="btn btn-primary">Güncelle</button>
      </form>
    `;
    this.showModal('Masa Düzenle', modalBody);
    document.getElementById('edit-table-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const tableNumber = document.getElementById('edit-table-number').value;
      try {
        await API.put(`/api/tables/${table.id}`, { number: tableNumber, qr_code: table.qr_code, status: table.status });
        this.showToast('Masa güncellendi', 'success');
        this.closeModal();
        this.loadTables();
      } catch (error) {
        this.showToast('Masa güncellenirken hata oluştu', 'error');
      }
    });
  }

  // Masa silme fonksiyonu
  async deleteTable(id) {
    if (!confirm('Bu masayı silmek istediğinize emin misiniz?')) return;
    try {
      await API.delete(`/api/tables/${id}`);
      this.showToast('Masa silindi', 'success');
      this.loadTables();
    } catch (error) {
      this.showToast('Masa silinirken hata oluştu', 'error');
    }
  }

  // QR kod gösterme fonksiyonu
  async generateQR(id) {
    try {
      const table = await API.get(`/api/tables/${id}/details`);
      const url = `${window.location.origin}/menu/${table.id}`;
      const modalBody = `
        <div style="text-align:center;">
          <div id="qr-code-container"></div>
          <p><strong>URL:</strong> <a href="${url}" target="_blank">${url}</a></p>
        </div>
      `;
      this.showModal('QR Kod', modalBody);
      setTimeout(() => {
        if (typeof QRCode !== 'undefined') {
          new QRCode(document.getElementById('qr-code-container'), {
            text: url,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
        }
      }, 100);
    } catch (error) {
      this.showToast('QR kod oluşturulurken hata oluştu', 'error');
    }
  }

  // Modal gösterme ve kapama fonksiyonları
  showModal(title, bodyHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-overlay').style.display = 'flex';
  }
  closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
  }

  // Placeholder fonksiyonlar
  editTable(id) {
    this.showToast('Masa düzenleme özelliği yakında eklenecek', 'info');
  }

  editCategory(id) {
    this.showToast('Kategori düzenleme özelliği yakında eklenecek', 'info');
  }

  deleteCategory(id) {
    this.showToast('Kategori silme özelliği yakında eklenecek', 'info');
  }

  editMenuItem(id) {
    this.showToast('Menü öğesi düzenleme özelliği yakında eklenecek', 'info');
  }

  deleteMenuItem(id) {
    this.showToast('Menü öğesi silme özelliği yakında eklenecek', 'info');
  }
}

// Global fonksiyonlar
function logout() {
  if (window.adminPanel) {
    window.adminPanel.logout();
  }
}

function refreshOrders() {
  if (window.adminPanel) {
    window.adminPanel.loadOrders();
  }
}

function refreshAnalytics() {
  if (window.adminPanel) {
    window.adminPanel.loadAnalytics();
  }
}

function addTable() {
  if (window.adminPanel) {
    window.adminPanel.showToast('Masa ekleme özelliği yakında eklenecek', 'info');
  }
}

function addCategory() {
  if (window.adminPanel) {
    window.adminPanel.showToast('Kategori ekleme özelliği yakında eklenecek', 'info');
  }
}

function addMenuItem() {
  if (window.adminPanel) {
    window.adminPanel.showToast('Menü öğesi ekleme özelliği yakında eklenecek', 'info');
  }
}

// Admin paneli başlat
console.log('Admin paneli başlatılıyor...');
const adminPanel = new AdminPanel();
console.log('Admin paneli başlatıldı:', adminPanel);

document.addEventListener('DOMContentLoaded', function() {
  window.adminPanel = new AdminPanel();
  window.closeModal = () => window.adminPanel.closeModal();
  window.addTable = () => window.adminPanel.showAddTableModal();
}); 