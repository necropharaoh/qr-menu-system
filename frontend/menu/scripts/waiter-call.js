class WaiterCallManager {
    constructor() {
        this.tableId = this.getTableIdFromUrl();
        this.isCallActive = false;
        
        this.init();
    }

    getTableIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1] || '1';
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Garson çağır butonu
        const waiterBtn = document.getElementById('fab-waiter');
        if (waiterBtn) {
            waiterBtn.addEventListener('click', () => {
                this.showWaiterCallModal();
            });
        }

        // Modal olayları
        const confirmBtn = document.getElementById('confirm-waiter-call');
        const cancelBtn = document.getElementById('cancel-waiter-call');
        const closeBtn = document.getElementById('close-waiter-modal');

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.callWaiter();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeWaiterModal();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeWaiterModal();
            });
        }

        // Modal dışına tıklayınca kapat
        const modal = document.getElementById('waiter-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeWaiterModal();
                }
            });
        }
    }

    showWaiterCallModal() {
        const modal = document.getElementById('waiter-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeWaiterModal() {
        const modal = document.getElementById('waiter-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    async callWaiter() {
        if (this.isCallActive) {
            this.showToast('Zaten aktif bir garson çağrınız var', 'warning');
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch('/api/waiter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    table_id: parseInt(this.tableId)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Garson çağrısı gönderilemedi');
            }

            const result = await response.json();
            
            this.isCallActive = true;
            this.closeWaiterModal();
            this.showToast('Garson çağrınız gönderildi', 'success');
            
            // WebSocket ile de gönder
            if (window.webSocketManager) {
                window.webSocketManager.sendWaiterCall();
            }

            // Buton durumunu güncelle
            this.updateWaiterButton(true);

        } catch (error) {
            console.error('Garson çağrısı hatası:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateWaiterButton(isActive) {
        const waiterBtn = document.getElementById('fab-waiter');
        if (waiterBtn) {
            if (isActive) {
                waiterBtn.classList.add('active');
                waiterBtn.innerHTML = '<i class="fas fa-bell-slash"></i>';
                waiterBtn.title = 'Garson çağrısını iptal et';
            } else {
                waiterBtn.classList.remove('active');
                waiterBtn.innerHTML = '<i class="fas fa-bell"></i>';
                waiterBtn.title = 'Garson çağır';
            }
        }
    }

    // Garson çağrısı çözüldüğünde çağrılır
    resolveCall() {
        this.isCallActive = false;
        this.updateWaiterButton(false);
        this.showToast('Garson çağrınız çözüldü', 'info');
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
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.add('show');
        }
    }

    hideLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.remove('show');
        }
    }

    // Aktif çağrıları kontrol et
    async checkActiveCalls() {
        try {
            const response = await fetch(`/api/waiter/table/${this.tableId}`);
            const calls = await response.json();
            
            const activeCall = calls.find(call => call.status === 'pending');
            this.isCallActive = !!activeCall;
            this.updateWaiterButton(this.isCallActive);
            
        } catch (error) {
            console.error('Aktif çağrı kontrolü hatası:', error);
        }
    }
}

// Sayfa yüklendiğinde garson çağırma yöneticisini başlat
document.addEventListener('DOMContentLoaded', () => {
    window.waiterCallManager = new WaiterCallManager();
    
    // Sayfa yüklendiğinde aktif çağrıları kontrol et
    setTimeout(() => {
        if (window.waiterCallManager) {
            window.waiterCallManager.checkActiveCalls();
        }
    }, 1000);
}); 