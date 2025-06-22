class CartManager {
    constructor() {
        this.items = [];
        this.tableId = this.getTableIdFromUrl();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartBadge();
    }

    getTableIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1] || '1';
    }

    setupEventListeners() {
        // Sepet açma/kapama
        document.getElementById('fab-cart').addEventListener('click', () => {
            this.toggleCart();
        });

        document.getElementById('close-cart').addEventListener('click', () => {
            this.closeCart();
        });

        // Sipariş verme
        document.getElementById('place-order').addEventListener('click', () => {
            this.placeOrder();
        });

        // Sepet dışına tıklayınca kapat
        document.addEventListener('click', (e) => {
            const cartSidebar = document.getElementById('cart-sidebar');
            const fabCart = document.getElementById('fab-cart');
            
            if (!cartSidebar.contains(e.target) && !fabCart.contains(e.target) && cartSidebar.classList.contains('open')) {
                this.closeCart();
            }
        });
    }

    addItem(item) {
        const existingItem = this.items.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...item,
                quantity: 1
            });
        }
        
        this.updateCartDisplay();
        this.updateCartBadge();
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.updateCartDisplay();
        this.updateCartBadge();
    }

    updateQuantity(itemId, newQuantity) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(itemId);
            } else {
                item.quantity = newQuantity;
                this.updateCartDisplay();
                this.updateCartBadge();
            }
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        cartItems.innerHTML = '';
        
        if (this.items.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #6c757d; margin-bottom: 1rem;"></i>
                    <p>Sepetiniz boş</p>
                </div>
            `;
            cartTotal.textContent = '₺0.00';
            return;
        }
        
        this.items.forEach(item => {
            const cartItem = this.createCartItemElement(item);
            cartItems.appendChild(cartItem);
        });
        
        const total = this.calculateTotal();
        cartTotal.textContent = `₺${total.toFixed(2)}`;
    }

    createCartItemElement(item) {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₺${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="window.cartManager.updateQuantity(${item.id}, ${item.quantity - 1})">
                    <i class="fas fa-minus"></i>
                </button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="window.cartManager.updateQuantity(${item.id}, ${item.quantity + 1})">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        
        return cartItem;
    }

    calculateTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    updateCartBadge() {
        const badge = document.getElementById('cart-badge');
        const totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
        badge.textContent = totalItems;
        
        if (totalItems === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'flex';
        }
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        cartSidebar.classList.toggle('open');
    }

    closeCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        cartSidebar.classList.remove('open');
    }

    async placeOrder() {
        if (this.items.length === 0) {
            this.showToast('Sepetiniz boş', 'warning');
            return;
        }

        try {
            this.showLoading();
            
            const orderData = {
                table_id: parseInt(this.tableId),
                items: this.items.map(item => ({
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    notes: ''
                })),
                notes: ''
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                throw new Error('Sipariş gönderilemedi');
            }

            const result = await response.json();
            
            // Sepeti temizle
            this.items = [];
            this.updateCartDisplay();
            this.updateCartBadge();
            this.closeCart();
            
            // Başarı mesajı göster
            this.showToast('Siparişiniz başarıyla alındı!', 'success');
            
            // Sipariş durumu modalını aç
            this.showOrderStatus(result.id);
            
        } catch (error) {
            console.error('Sipariş hatası:', error);
            this.showToast('Sipariş gönderilirken hata oluştu', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async showOrderStatus(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            const order = await response.json();
            
            const modal = document.getElementById('order-modal');
            const content = document.getElementById('order-status-content');
            
            content.innerHTML = `
                <div class="order-status">
                    <div class="order-info">
                        <h4>Sipariş #${order.id}</h4>
                        <p>Durum: <span class="status-${order.status}">${this.getStatusText(order.status)}</span></p>
                        <p>Toplam: ₺${order.total_amount}</p>
                    </div>
                    <div class="order-items">
                        <h5>Sipariş Öğeleri:</h5>
                        <ul>
                            ${order.items.map(item => `
                                <li>${item.name} x${item.quantity} - ₺${item.price}</li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
            
            modal.classList.add('show');
            
        } catch (error) {
            console.error('Sipariş durumu yüklenemedi:', error);
        }
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Beklemede',
            'preparing': 'Hazırlanıyor',
            'ready': 'Hazır',
            'served': 'Servis Edildi',
            'cancelled': 'İptal Edildi'
        };
        return statusMap[status] || status;
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

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

// Sayfa yüklendiğinde sepet yöneticisini başlat
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
    
    // Modal kapatma olayları
    document.getElementById('close-order-modal').addEventListener('click', () => {
        document.getElementById('order-modal').classList.remove('show');
    });
}); 