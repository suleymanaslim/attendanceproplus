import { store, haptic } from '../store.js';
import { USERS } from '../data/users.js';
import { icon } from '../icons.js';
import { navigate } from '../app.js';

export function renderPinLogin(container) {
    const savedUser = localStorage.getItem('currentUser');

    // If user already selected → go straight to home
    if (savedUser && USERS[savedUser]) {
        store.set('currentUser', savedUser);
        navigate('home');
        return;
    }

    renderUserSelect(container);
}

function renderUserSelect(container) {
    container.innerHTML = `
        <div class="pin-container pin-login-premium">
            <div class="animate-fade-in" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
                <img src="/icons/logo.png" alt="AttendanceProPlus" style="display: block; width: 180px; height: 180px; margin-bottom: 40px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));" />

                <div style="width: 100%; max-width: 340px;">
                    <p class="section-label" style="text-align: center; margin-bottom: 16px; color: rgba(255,255,255,0.7);">Hesap Seç</p>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${Object.entries(USERS).map(([id, user], index) => `
              <button class="card card-interactive animate-slide-up stagger-${index + 1}" data-user="${id}" style="text-align: left; cursor: pointer; display: flex; align-items: center; gap: 14px; padding: 16px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.25); color: white !important;">
                <div style="width: 52px; height: 52px; border-radius: 16px; background: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: #1a8cd8; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  ${user.name.charAt(0)}
                </div>
                <div style="flex: 1;">
                  <div style="font-size: 16px; font-weight: 700; color: white !important;">${user.name}</div>
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8) !important;">${Object.keys(user.courses).length} ders</div>
                </div>
                <div style="color: white !important; opacity: 0.8;">${icon('chevronRight', 16)}</div>
              </button>
            `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    container.querySelectorAll('[data-user]').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.user;
            localStorage.setItem('currentUser', userId);
            store.set('currentUser', userId);
            haptic('light');
            navigate('home');
        });
    });
}
