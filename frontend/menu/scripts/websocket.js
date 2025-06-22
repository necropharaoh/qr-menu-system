// Netlify Functions için Polling Tabanlı Gerçek Zamanlı Güncelleme Sistemi
class RealTimeUpdates {
    constructor() {
        this.pollingInterval = null;
        this.lastOrderUpdate = null;
        this.lastCallUpdate = null;
        this.isConnected = false;
        this.tableId = Utils.getUrlParameter('table') || 1;
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
        }, 3000); // 3 saniyede bir kontrol et

        console.log('Gerçek zamanlı güncellemeler başlatıldı');
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            this.isConnected = false;
            console.log('Gerçek zamanlı güncellemeler durduruldu');
        }
    }

    async checkForUpdates() {
        try {
            // Sipariş güncellemelerini kontrol et
            await this.checkOrderUpdates();
            
            // Garson çağrısı güncellemelerini kontrol et
            await this.checkWaiterCallUpdates();
            
        } catch (error) {
            console.error('Güncelleme kontrolü hatası:', error);
        }
    }

    async checkOrderUpdates() {
        try {
            const orders = await API.get(`/orders/table/${this.tableId}`);
            
            // Yeni sipariş var mı kontrol et
            if (orders.length > 0) {
                const latestOrder = orders[0];
                
                if (!this.lastOrderUpdate || latestOrder.updated_at > this.lastOrderUpdate) {
                    this.lastOrderUpdate = latestOrder.updated_at;
                    this.handleOrderUpdate(latestOrder);
                }
            }
        } catch (error) {
            console.error('Sipariş güncellemesi kontrolü hatası:', error);
        }
    }

    async checkWaiterCallUpdates() {
        try {
            const calls = await API.get(`/waiter/table/${this.tableId}`);
            
            // Yeni garson çağrısı var mı kontrol et
            if (calls.length > 0) {
                const latestCall = calls[0];
                
                if (!this.lastCallUpdate || latestCall.created_at > this.lastCallUpdate) {
                    this.lastCallUpdate = latestCall.created_at;
                    this.handleWaiterCallUpdate(latestCall);
                }
            }
        } catch (error) {
            console.error('Garson çağrısı güncellemesi kontrolü hatası:', error);
        }
    }

    handleOrderUpdate(order) {
        // Sipariş durumu değişikliği bildirimi
        const statusMessages = {
            'pending': 'Siparişiniz alındı ve hazırlanıyor',
            'preparing': 'Siparişiniz mutfakta hazırlanıyor',
            'ready': 'Siparişiniz hazır! Garson getiriyor',
            'served': 'Siparişiniz servis edildi. Afiyet olsun!',
            'cancelled': 'Siparişiniz iptal edildi'
        };

        const message = statusMessages[order.status] || 'Sipariş durumu güncellendi';
        
        // Bildirim göster
        Utils.showToast(message, order.status === 'cancelled' ? 'error' : 'success');
        
        // Ses çal
        if (order.status === 'ready') {
            Utils.playSound('success');
        } else if (order.status === 'cancelled') {
            Utils.playSound('error');
        } else {
            Utils.playSound('notification');
        }

        // Sepet durumunu güncelle
        if (order.status === 'served' || order.status === 'cancelled') {
            // Sepeti temizle
            if (window.cart) {
                window.cart.clear();
            }
        }

        // Sipariş listesini güncelle
        this.updateOrderDisplay(order);
    }

    handleWaiterCallUpdate(call) {
        if (call.status === 'resolved') {
            Utils.showToast('Garson çağrınız yanıtlandı', 'success');
            Utils.playSound('success');
        }
    }

    updateOrderDisplay(order) {
        // Sipariş durumu göstergesini güncelle
        const orderStatusElement = document.getElementById('orderStatus');
        if (orderStatusElement) {
            orderStatusElement.textContent = this.getStatusText(order.status);
            orderStatusElement.className = `order-status ${order.status}`;
        }

        // Sipariş listesini güncelle
        const ordersListElement = document.getElementById('ordersList');
        if (ordersListElement) {
            this.loadOrdersList();
        }
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Bekliyor',
            'preparing': 'Hazırlanıyor',
            'ready': 'Hazır',
            'served': 'Servis Edildi',
            'cancelled': 'İptal'
        };
        return statusMap[status] || status;
    }

    async loadOrdersList() {
        try {
            const orders = await API.get(`/orders/table/${this.tableId}`);
            const ordersListElement = document.getElementById('ordersList');
            
            if (ordersListElement && orders.length > 0) {
                ordersListElement.innerHTML = orders.map(order => `
                    <div class="order-item ${order.status}">
                        <div class="order-header">
                            <span class="order-number">#${order.id}</span>
                            <span class="order-status">${this.getStatusText(order.status)}</span>
                        </div>
                        <div class="order-items">${order.items || ''}</div>
                        <div class="order-footer">
                            <span class="order-amount">${Utils.formatPrice(order.total_amount)}</span>
                            <span class="order-time">${Utils.formatDate(order.created_at)}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Sipariş listesi yükleme hatası:', error);
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
}

// Global değişken olarak başlat
window.realTimeUpdates = new RealTimeUpdates();

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    if (window.realTimeUpdates) {
        window.realTimeUpdates.startPolling();
    }
}); 