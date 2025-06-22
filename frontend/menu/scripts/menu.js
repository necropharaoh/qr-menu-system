class MenuManager {
    constructor() {
        this.categories = [];
        this.menuItems = [];
        this.currentCategory = null;
        this.tableId = this.getTableIdFromUrl();
        
        this.init();
    }

    async init() {
        await this.loadRestaurantInfo();
        await this.loadCategories();
        await this.loadMenuItems();
        this.setupEventListeners();
        this.renderCategories();
        this.renderMenuItems();
    }

    getTableIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1] || '1';
    }

    async loadRestaurantInfo() {
        try {
            const response = await fetch('/api/restaurant');
            const restaurant = await response.json();
            
            document.getElementById('restaurant-name').textContent = restaurant.name || 'QR Menü Restoran';
            document.getElementById('restaurant-address').textContent = restaurant.address || 'Örnek Adres';
        } catch (error) {
            console.error('Restoran bilgileri yüklenemedi:', error);
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/menu/categories');
            this.categories = await response.json();
        } catch (error) {
            console.error('Kategoriler yüklenemedi:', error);
            this.showToast('Kategoriler yüklenirken hata oluştu', 'error');
        }
    }

    async loadMenuItems() {
        try {
            const response = await fetch('/api/menu/items');
            this.menuItems = await response.json();
        } catch (error) {
            console.error('Menü öğeleri yüklenemedi:', error);
            this.showToast('Menü öğeleri yüklenirken hata oluştu', 'error');
        }
    }

    setupEventListeners() {
        // Kategori tıklama olayları
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-item')) {
                const categoryId = e.target.dataset.categoryId;
                this.selectCategory(categoryId);
            }
        });

        // Menü öğesi ekleme olayları
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                const itemId = e.target.dataset.itemId;
                this.addToCart(itemId);
            }
        });
    }

    renderCategories() {
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';

        // Tümü kategorisi
        const allCategory = document.createElement('div');
        allCategory.className = 'category-item active';
        allCategory.textContent = 'Tümü';
        allCategory.dataset.categoryId = 'all';
        categoryList.appendChild(allCategory);

        // Diğer kategoriler
        this.categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-item';
            categoryElement.textContent = category.name;
            categoryElement.dataset.categoryId = category.id;
            categoryList.appendChild(categoryElement);
        });

        // İlk kategoriyi seç
        this.selectCategory('all');
    }

    renderMenuItems(categoryId = 'all') {
        const menuContainer = document.getElementById('menu-container');
        menuContainer.innerHTML = '';

        let itemsToShow = this.menuItems;
        
        if (categoryId !== 'all') {
            itemsToShow = this.menuItems.filter(item => item.category_id == categoryId);
        }

        if (itemsToShow.length === 0) {
            menuContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils" style="font-size: 3rem; color: #6c757d; margin-bottom: 1rem;"></i>
                    <p>Bu kategoride henüz ürün bulunmuyor.</p>
                </div>
            `;
            return;
        }

        const menuGrid = document.createElement('div');
        menuGrid.className = 'menu-grid';

        itemsToShow.forEach(item => {
            const menuItem = this.createMenuItemElement(item);
            menuGrid.appendChild(menuItem);
        });

        menuContainer.appendChild(menuGrid);
    }

    createMenuItemElement(item) {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        
        menuItem.innerHTML = `
            <div class="menu-item-image">
                ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<i class="fas fa-utensils"></i>'}
            </div>
            <div class="menu-item-content">
                <h3 class="menu-item-title">${item.name}</h3>
                <p class="menu-item-description">${item.description || 'Açıklama bulunmuyor'}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">₺${item.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" data-item-id="${item.id}">
                        <i class="fas fa-plus"></i> Ekle
                    </button>
                </div>
            </div>
        `;

        return menuItem;
    }

    selectCategory(categoryId) {
        // Aktif kategoriyi güncelle
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-category-id="${categoryId}"]`).classList.add('active');
        
        // Menü öğelerini yeniden render et
        this.renderMenuItems(categoryId);
        this.currentCategory = categoryId;
    }

    addToCart(itemId) {
        const item = this.menuItems.find(item => item.id == itemId);
        if (!item) return;

        // Cart manager'a ekle
        if (window.cartManager) {
            window.cartManager.addItem(item);
            this.showToast(`${item.name} sepete eklendi`, 'success');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // 3 saniye sonra kaldır
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showLoading() {
        document.getElementById('loading-spinner').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loading-spinner').classList.remove('show');
    }
}

// Sayfa yüklendiğinde menü yöneticisini başlat
document.addEventListener('DOMContentLoaded', () => {
    window.menuManager = new MenuManager();
}); 