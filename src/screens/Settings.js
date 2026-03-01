import { store, toggleTheme, showToast, showConfirm, haptic } from '../store.js';
import { getUser } from '../data/users.js';
import { getCourses, updateCourseLimit, exportData, importData } from '../db/database.js';
import { icon } from '../icons.js';
import { navigate } from '../app.js';

export async function renderSettings(container) {
  const userId = store.get('currentUser');
  const user = getUser(userId);
  if (!user) { navigate('login'); return; }

  const dbCourses = await getCourses(userId);
  const theme = store.get('theme');

  container.innerHTML = `
    <div class="screen">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;" class="animate-fade-in">
        ${icon('settings', 20)}
        <h1 style="font-size: 22px; font-weight: 800; margin: 0;">Ayarlar</h1>
      </div>

      <!-- Theme -->
      <div class="card animate-slide-up stagger-1" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${icon('palette', 18)}
            <div>
              <div style="font-size: 14px; font-weight: 600;">Tema</div>
              <div style="font-size: 11px; color: var(--muted);">Arayüz görünümü</div>
            </div>
          </div>
          <button id="theme-btn" class="btn btn-outline btn-sm" style="gap: 5px;">
            ${theme === 'dark' ? icon('moon', 14) + ' Koyu' : icon('sun', 14) + ' Açık'}
          </button>
        </div>
      </div>

      <!-- Absence Limits -->
      <div class="card animate-slide-up stagger-2" style="margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          ${icon('shield', 16)}
          <h3 style="font-size: 14px; font-weight: 700; margin: 0;">Devamsızlık Limitleri</h3>
        </div>
        <p style="font-size: 11px; color: var(--muted); margin: 0 0 14px;">Ders başlarına maksimum devamsızlık ayarlayın (varsayılan: %30)</p>
        
        <div style="display: flex; flex-direction: column; gap: 8px;" id="limits-container">
          ${dbCourses.map(course => `
            <div class="limit-item" data-id="${course.id}" style="padding: 10px; border-radius: 8px; background: ${course.color}08; border: 1px solid ${course.color}18;">
              <div style="margin-bottom: 8px;">
                <span style="font-size: 13px; font-weight: 600;">${course.name}</span>
                <span style="font-size: 10px; color: var(--muted); margin-left: 4px;">${course.code} &middot; ${course.semesterTotalHours}s</span>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <select class="input limit-type" data-id="${course.id}" style="width: auto; padding: 7px 10px; font-size: 12px;">
                  <option value="percent" ${course.absenceLimit?.type === 'percent' ? 'selected' : ''}>%</option>
                  <option value="hours" ${course.absenceLimit?.type === 'hours' ? 'selected' : ''}>Saat</option>
                </select>
                <input type="number" class="input limit-value" data-id="${course.id}" value="${course.absenceLimit?.value || 30}" placeholder="Değer" min="0" style="flex: 1; padding: 7px 10px; font-size: 12px;" />
                <button class="btn btn-primary btn-sm save-limit-btn" data-id="${course.id}" style="padding: 7px 10px; font-size: 11px;">
                  ${icon('check', 14)}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Backup -->
      <div class="card animate-slide-up stagger-3" style="margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          ${icon('save', 16)}
          <h3 style="font-size: 14px; font-weight: 700; margin: 0;">Veri Yedekleme</h3>
        </div>
        <p style="font-size: 11px; color: var(--muted); margin: 0 0 14px;">JSON formatında yedekle ve geri yükle</p>
        
        <div style="display: flex; gap: 8px;">
          <button id="export-btn" class="btn btn-outline" style="flex: 1; padding: 10px; font-size: 12px; gap: 6px;">
            ${icon('download', 14)} Dışa Aktar
          </button>
          <label class="btn btn-outline" style="flex: 1; padding: 10px; font-size: 12px; cursor: pointer; gap: 6px;">
            ${icon('upload', 14)} Geri Yükle
            <input type="file" id="import-input" accept=".json" style="display: none;" />
          </label>
        </div>
      </div>

      <!-- Logout -->
      <div class="card animate-slide-up stagger-4" style="margin-bottom: 10px;">
        <button id="logout-btn" class="btn btn-danger" style="width: 100%; padding: 12px; gap: 8px;">
          ${icon('logOut', 16)} Çıkış Yap
        </button>
      </div>

      <!-- Storage Info -->
      <div class="card animate-slide-up stagger-5" style="margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          ${icon('inbox', 16)}
          <h3 style="font-size: 14px; font-weight: 700; margin: 0;">Depolama</h3>
        </div>
        <div id="storage-info" style="font-size: 12px; color: var(--muted);">Hesaplanıyor...</div>
      </div>

      <!-- App Info -->
      <div class="animate-slide-up stagger-6" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 20px 0; opacity: 0.4;">
        <img src="/icons/logo.png" alt="Logo" style="width: 28px; height: 28px; border-radius: 6px;" />
        <div>
          <p style="font-size: 11px; font-weight: 700; margin: 0;">
            <span style="color: var(--color-brand);">Attendance</span><span style="color: var(--color-accent);">Pro+</span>
            <span style="font-weight: 400; opacity: 0.6;">v2.0</span>
          </p>
          <p style="font-size: 9px; color: var(--muted); margin: 1px 0 0;">Süleyman Aslım</p>
        </div>
      </div>
    </div>
  `;

  // Theme
  container.querySelector('#theme-btn').addEventListener('click', () => { toggleTheme(); haptic('light'); renderSettings(container); });

  // Save limits
  container.querySelectorAll('.save-limit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const courseId = Number(btn.dataset.id);
      const type = container.querySelector(`.limit-type[data-id="${courseId}"]`).value;
      const value = Number(container.querySelector(`.limit-value[data-id="${courseId}"]`).value);

      if (!value || value <= 0) { showToast('Geçerli değer girin', 'warning'); return; }
      if (type === 'percent' && value > 100) { showToast('En fazla %100', 'warning'); return; }

      const success = await updateCourseLimit(courseId, type, value);
      if (success) {
        haptic('success');
        const displayVal = type === 'percent' ? `%${value}` : `${value} saat`;
        showToast(`✅ Limit güncellendi: ${displayVal}`, 'success');
        btn.innerHTML = `${icon('check', 14)}`;
        btn.style.background = 'var(--color-success)';
        btn.style.color = 'white';
        setTimeout(() => { btn.innerHTML = icon('check', 14); btn.style.background = ''; btn.style.color = ''; }, 2000);
      } else {
        haptic('error');
        showToast('Başarısız', 'error');
      }
    });
  });

  // Export
  container.querySelector('#export-btn').addEventListener('click', async () => {
    try {
      const json = await exportData(userId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_backup_${userId}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      haptic('success');
      showToast('Yedek indirildi', 'success');
    } catch (err) {
      showToast('Dışa aktarma başarısız', 'error');
    }
  });

  // Import
  container.querySelector('#import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      showConfirm('Verileri Geri Yükle', 'Mevcut veriler silinip yedekten yüklenecek. Emin misiniz?', async () => {
        try {
          await importData(event.target.result);
          haptic('success');
          showToast('Veriler geri yüklendi', 'success');
          renderSettings(container);
        } catch (err) {
          haptic('error');
          showToast('Başarısız: ' + err.message, 'error');
        }
      });
    };
    reader.readAsText(file);
  });

  // Logout (no more PIN, just clear user)
  container.querySelector('#logout-btn').addEventListener('click', () => {
    showConfirm('Çıkış Yap', 'Oturumunuz sonlandırılacak. Veriler cihazda korunur.', () => {
      localStorage.removeItem('currentUser');
      store.set('currentUser', null);
      haptic('light');
      navigate('login');
    });
  });

  // Storage estimate
  const storageEl = container.querySelector('#storage-info');
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      const usedMB = (est.usage / (1024 * 1024)).toFixed(2);
      const quotaMB = (est.quota / (1024 * 1024)).toFixed(0);
      const pct = ((est.usage / est.quota) * 100).toFixed(1);
      storageEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span>${usedMB} MB kullanılıyor</span>
          <span style="font-weight: 600;">${pct}%</span>
        </div>
        <div style="height: 4px; border-radius: 2px; background: var(--border); overflow: hidden;">
          <div style="height: 100%; width: ${pct}%; background: var(--color-brand); border-radius: 2px;"></div>
        </div>
        <div style="font-size: 10px; color: var(--muted); margin-top: 4px;">Toplam: ~${quotaMB} MB</div>
      `;
    } catch (e) {
      storageEl.textContent = 'Hesaplanamadı';
    }
  } else {
    storageEl.textContent = 'Bu tarayıcıda desteklenmiyor';
  }
}
