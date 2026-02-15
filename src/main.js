import { store, initTheme } from './store.js';
import { syncFallbackData } from './db/database.js';
import { renderApp, navigate } from './app.js';
import './style.css';

// Initialize
async function init() {
  // Theme
  initTheme();

  // Sync any fallback data from localStorage
  await syncFallbackData();

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (err) {
      console.log('SW registration failed:', err);
    }
  }

  // Check for existing session
  const savedUser = localStorage.getItem('currentUser');
  const pinVerified = localStorage.getItem('pinVerified');

  if (savedUser && pinVerified === 'true') {
    store.set('currentUser', savedUser);
    navigate('home');
  } else if (savedUser) {
    navigate('login');
  } else {
    navigate('login');
  }

  // Render app
  renderApp();

  // Check Friday backup reminder
  checkBackupReminder();

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(2) || 'login';
    const [screen, params] = parseHash(hash);
    store.set('screenParams', params);
    store.set('currentScreen', screen);
  });
}

function parseHash(hash) {
  const [screen, queryString] = hash.split('?');
  const params = {};
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }
  return [screen, params];
}

function checkBackupReminder() {
  const today = new Date();
  if (today.getDay() !== 5) return; // Only Friday

  const lastReminder = localStorage.getItem('lastBackupReminder');
  const todayStr = today.toISOString().split('T')[0];

  if (lastReminder !== todayStr) {
    localStorage.setItem('lastBackupReminder', todayStr);
    // Will show after login
    localStorage.setItem('showBackupReminder', 'true');
  }
}

init();
