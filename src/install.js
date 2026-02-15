import { icon } from './icons.js';

let deferredPrompt = null;

// Listen for beforeinstallprompt (Android/Desktop)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

export function showInstallPrompt() {
    // Don't show if already installed or dismissed recently
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;

    const dismissed = localStorage.getItem('installDismissed');
    const openCount = Number(localStorage.getItem('openCount') || 0) + 1;
    localStorage.setItem('openCount', String(openCount));

    if (dismissed && openCount % 3 !== 1) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (deferredPrompt) {
        showNativePrompt();
    } else if (isIOS) {
        showIOSPrompt();
    }
}

function showNativePrompt() {
    const el = document.createElement('div');
    el.className = 'install-prompt';
    el.innerHTML = `
    <div class="card" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin: 0 auto; box-sizing: border-box;">
      <img src="/icons/logo.png" alt="" style="width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;" />
      <div style="flex: 1; min-width: 0;">
        <p style="font-size: 13px; font-weight: 600; margin: 0;">Uygulamayı Yükle</p>
        <p style="font-size: 11px; color: var(--muted); margin: 2px 0 0;">Ana ekrana ekle, çevrimdışı kullan</p>
      </div>
      <button id="install-yes" class="btn btn-primary btn-sm" style="flex-shrink: 0; white-space: nowrap;">${icon('download', 13)} Yükle</button>
      <button id="install-no" class="btn btn-ghost btn-sm" style="padding: 6px; flex-shrink: 0;">${icon('x', 14)}</button>
    </div>
  `;

    document.body.appendChild(el);

    el.querySelector('#install-yes').addEventListener('click', async () => {
        el.remove();
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
        }
    });

    el.querySelector('#install-no').addEventListener('click', () => {
        el.remove();
        localStorage.setItem('installDismissed', 'true');
    });
}

function showIOSPrompt() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content" style="text-align: center;">
      <div class="modal-handle"></div>
      <img src="/icons/logo.png" alt="" style="width: 48px; height: 48px; border-radius: 12px; margin: 0 auto 14px; display: block;" />
      <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 4px;">Ana Ekrana Ekle</h3>
      <p style="font-size: 12px; color: var(--muted); margin: 0 0 20px;">Uygulamayı standart bir uygulama gibi kullanabilirsiniz</p>

      <div style="display: flex; flex-direction: column; gap: 14px; text-align: left;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(26, 140, 216, 0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--color-brand);">
            ${icon('share', 16)}
          </div>
          <div>
            <p style="font-size: 12px; font-weight: 600; margin: 0;">1. Paylaşım butonuna tıklayın</p>
            <p style="font-size: 10px; color: var(--muted); margin: 2px 0 0;">Alttaki menü çubuğundan</p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(26, 140, 216, 0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--color-brand);">
            ${icon('plus', 16)}
          </div>
          <div>
            <p style="font-size: 12px; font-weight: 600; margin: 0;">2. "Ana Ekrana Ekle" seçin</p>
            <p style="font-size: 10px; color: var(--muted); margin: 2px 0 0;">Menüden aşağı kayıp seçin</p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(26, 140, 216, 0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--color-brand);">
            ${icon('check', 16)}
          </div>
          <div>
            <p style="font-size: 12px; font-weight: 600; margin: 0;">3. "Ekle" butonuna tıklayın</p>
            <p style="font-size: 10px; color: var(--muted); margin: 2px 0 0;">Uygulama ana ekranınıza eklenecek</p>
          </div>
        </div>
      </div>

      <button id="ios-dismiss" class="btn btn-outline" style="width: 100%; margin-top: 20px;">Anladım</button>
    </div>
  `;

    document.body.appendChild(overlay);

    overlay.querySelector('#ios-dismiss').addEventListener('click', () => {
        overlay.remove();
        localStorage.setItem('installDismissed', 'true');
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            localStorage.setItem('installDismissed', 'true');
        }
    });
}
