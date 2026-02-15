import { store } from './store.js';
import { renderPinLogin } from './screens/PinLogin.js';
import { renderHome } from './screens/Home.js';
import { renderAddAbsence } from './screens/AddAbsence.js';
import { renderStats } from './screens/Stats.js';
import { renderWeeklySchedule } from './screens/WeeklySchedule.js';
import { renderSettings } from './screens/Settings.js';
import { icons } from './icons.js';

const app = document.getElementById('app');

const SCREENS = {
    login: renderPinLogin,
    home: renderHome,
    absence: renderAddAbsence,
    stats: renderStats,
    schedule: renderWeeklySchedule,
    settings: renderSettings
};

const NAV_SCREENS = ['home', 'schedule', 'stats', 'settings'];

export function navigate(screen, params = {}) {
    store.set('screenParams', params);
    let hash = `#/${screen}`;
    const paramStr = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    if (paramStr) hash += `?${paramStr}`;
    window.location.hash = hash;
    store.set('currentScreen', screen);
}

export function renderApp() {
    store.subscribe('currentScreen', (screen) => render(screen));
    render(store.get('currentScreen'));
}

function render(screen) {
    const renderFn = SCREENS[screen];
    if (!renderFn) { navigate('login'); return; }

    app.innerHTML = '';

    const screenContainer = document.createElement('div');
    screenContainer.id = 'screen-container';
    app.appendChild(screenContainer);

    renderFn(screenContainer);

    // Bottom nav for main screens
    if (NAV_SCREENS.includes(screen)) {
        renderBottomNav(app, screen);
    }
}

function renderBottomNav(container, activeScreen) {
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';

    const items = [
        { id: 'home', label: 'Ana Sayfa', icon: icons.home },
        { id: 'schedule', label: 'Program', icon: icons.calendar },
        { id: 'stats', label: 'Istatistik', icon: icons.barChart },
        { id: 'settings', label: 'Ayarlar', icon: icons.settings }
    ];

    nav.innerHTML = items.map(item => `
    <button class="nav-item ${activeScreen === item.id ? 'active' : ''}" data-screen="${item.id}">
      ${item.icon}
      <span>${item.label}</span>
    </button>
  `).join('');

    nav.addEventListener('click', (e) => {
        const btn = e.target.closest('.nav-item');
        if (btn) navigate(btn.dataset.screen);
    });

    container.appendChild(nav);
}
