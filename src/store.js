// Reactive Store — Observer pattern
class Store {
    constructor() {
        this.state = {
            currentUser: null,
            theme: localStorage.getItem('theme') || 'dark',
            currentScreen: 'login',
            screenParams: {}
        };
        this.listeners = new Map();
    }

    get(key) {
        return this.state[key];
    }

    set(key, value) {
        const old = this.state[key];
        this.state[key] = value;
        if (old !== value) {
            this.notify(key, value, old);
        }
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        return () => this.listeners.get(key).delete(callback);
    }

    notify(key, value, old) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(cb => cb(value, old));
        }
    }
}

export const store = new Store();

// Theme management
export function initTheme() {
    const theme = store.get('theme');
    document.documentElement.className = theme;
}

export function toggleTheme() {
    const current = store.get('theme');
    const next = current === 'dark' ? 'light' : 'dark';
    store.set('theme', next);
    document.documentElement.className = next;
    localStorage.setItem('theme', next);
}

// Toast notifications
export function showToast(message, type = 'success', duration = 3000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Haptic feedback
export function haptic(pattern = 'light') {
    if (!navigator.vibrate) return;
    switch (pattern) {
        case 'light': navigator.vibrate(50); break;
        case 'medium': navigator.vibrate(100); break;
        case 'heavy': navigator.vibrate([100, 50, 100]); break;
        case 'success': navigator.vibrate([50, 30, 50]); break;
        case 'error': navigator.vibrate([100, 50, 100, 50, 100]); break;
    }
}

// Confirm dialog
export function showConfirm(title, message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-handle"></div>
      <h3 style="font-size: 17px; font-weight: 700; margin: 0 0 6px;">${title}</h3>
      <p style="font-size: 13px; opacity: 0.5; margin: 0 0 20px;">${message}</p>
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-outline" style="flex: 1;" id="confirm-cancel">İptal</button>
        <button class="btn btn-primary" style="flex: 1;" id="confirm-ok">Onayla</button>
      </div>
    </div>
  `;
    document.body.appendChild(overlay);

    overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
        overlay.remove();
        if (onCancel) onCancel();
    });

    overlay.querySelector('#confirm-ok').addEventListener('click', () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            if (onCancel) onCancel();
        }
    });
}
