import { store, haptic } from '../store.js';
import { USERS } from '../data/users.js';
import { icon } from '../icons.js';
import { navigate } from '../app.js';

// Emoji avatars for users
const USER_EMOJIS = {
    user1: '😎',  // Hüseyin
    user2: '👨‍🏫',  // Süleyman
};

export function renderPinLogin(container) {
    const savedUser = localStorage.getItem('currentUser');

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
                <img src="/icons/logo.png" alt="AttendanceProPlus" style="display: block; width: 160px; height: 160px; margin-bottom: 12px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));" />
                <h1 style="font-size: 22px; font-weight: 800; color: white; margin: 0 0 4px; letter-spacing: -0.02em;">AttendanceProPlus</h1>
                <p style="font-size: 12px; color: rgba(255,255,255,0.5); margin: 0 0 32px;">Devamsızlık takip sistemi</p>

                <div style="width: 100%; max-width: 340px;">
                    <p style="text-align: center; margin-bottom: 14px; color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Hesap Seç</p>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${Object.entries(USERS).map(([id, user], index) => `
              <button class="card card-interactive animate-slide-up stagger-${index + 1}" data-user="${id}" style="text-align: left; cursor: pointer; display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.12); color: white !important; transition: all 0.2s ease;">
                <div style="width: 50px; height: 50px; border-radius: 14px; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0;">
                  ${USER_EMOJIS[id] || user.name.charAt(0)}
                </div>
                <div style="flex: 1;">
                  <div style="font-size: 15px; font-weight: 700; color: white !important;">${user.name}</div>
                  <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5) !important; margin-top: 2px;">${Object.keys(user.courses).length} ders kayıtlı</div>
                </div>
                <div style="color: white !important; opacity: 0.4;">${icon('chevronRight', 16)}</div>
              </button>
            `).join('')}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding: 16px 20px; text-align: center;">
                <p style="font-size: 10px; color: rgba(255,255,255,0.25); margin: 0;">v2.0 • built with ❤️</p>
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
