import { store, showToast, haptic, showConfirm } from '../store.js';
import { getUser, getAllScheduleFlat, getScheduleForDate, getTodaySchedule, getTomorrowSchedule, formatDate, getDayName, getDayNameTR, formatDateTR } from '../data/users.js';
import { getCourses, addAbsence, checkDuplicateAbsence } from '../db/database.js';
import { icon } from '../icons.js';
import { navigate } from '../app.js';

export async function renderAddAbsence(container) {
  const userId = store.get('currentUser');
  const user = getUser(userId);
  const params = store.get('screenParams') || {};
  const isPastMode = params.mode === 'past';
  const dbCourses = await getCourses(userId);

  if (isPastMode) {
    renderPastAbsence(container, userId, user, dbCourses);
  } else {
    renderTodayAbsence(container, userId, user, dbCourses);
  }
}

function renderTodayAbsence(container, userId, user, dbCourses) {
  const today = formatDate();
  const todaySchedule = getTodaySchedule(userId);
  const tomorrowSchedule = getTomorrowSchedule(userId);
  const allCourses = getAllScheduleFlat(userId);

  const todayCodes = new Set(todaySchedule.map(c => c.course));
  const tomorrowCodes = new Set(tomorrowSchedule.map(c => c.course));

  const sortedCourses = [...allCourses].sort((a, b) => {
    const aP = todayCodes.has(a.course) ? 0 : tomorrowCodes.has(a.course) ? 1 : 2;
    const bP = todayCodes.has(b.course) ? 0 : tomorrowCodes.has(b.course) ? 1 : 2;
    return aP - bP;
  });

  let lastCategory = '';

  container.innerHTML = `
    <div class="screen">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;" class="animate-fade-in">
        <button id="back-btn" class="btn btn-ghost" style="padding: 8px;">
          ${icon('chevronLeft', 22)}
        </button>
        <div>
          <h1 style="font-size: 20px; font-weight: 800; margin: 0;">Devamsızlık Ekle</h1>
          <p style="font-size: 12px; opacity: 0.5; margin: 2px 0 0;">${formatDateTR(today)}</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${sortedCourses.map((course, i) => {
    const isToday = todayCodes.has(course.course);
    const isTomorrow = tomorrowCodes.has(course.course);
    const scheduleEntry = isToday ? todaySchedule.find(s => s.course === course.course) : null;
    const hours = scheduleEntry ? scheduleEntry.hours : course.weeklyHours;
    const dbCourse = dbCourses.find(c => c.code === course.course);

    let categoryLabel = '';
    const currentCat = isToday ? 'today' : isTomorrow ? 'tomorrow' : 'other';
    if (currentCat !== lastCategory) {
      lastCategory = currentCat;
      const labels = { today: 'Bugünün Dersleri', tomorrow: 'Yarının Dersleri', other: 'Diğer Dersler' };
      categoryLabel = `<p class="section-label" style="margin-top: ${i === 0 ? '0' : '12px'};">${labels[currentCat]}</p>`;
    }

    return `
            ${categoryLabel}
            <button class="card card-interactive course-select-btn animate-slide-up stagger-${Math.min(i + 1, 8)}" data-code="${course.course}" data-hours="${isToday ? hours : ''}" data-name="${course.fullName}" data-course-id="${dbCourse?.id || ''}" style="display: flex; align-items: center; gap: 12px; padding: 14px; ${isToday ? `border-left: 4px solid ${dbCourse?.color || 'var(--color-brand)'};` : ''}">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: ${dbCourse?.color || 'var(--color-brand)'}16; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="font-size: 12px; font-weight: 700; color: ${dbCourse?.color || 'var(--color-brand)'};">${course.course.slice(0, 3)}</span>
              </div>
              <div style="flex: 1; min-width: 0; text-align: left;">
                <div style="font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${course.fullName}</div>
                <div style="font-size: 11px; opacity: 0.4; margin-top: 2px;">${course.course} &middot; ${isToday ? hours + 's bugün' : course.weeklyHours + 's/hafta'}</div>
              </div>
              ${icon('chevronRight', 16)}
            </button>
          `;
  }).join('')}
      </div>
    </div>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => navigate('home'));

  container.querySelectorAll('.course-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      const name = btn.dataset.name;
      const hoursStr = btn.dataset.hours;
      const courseId = btn.dataset.courseId;
      if (hoursStr) {
        showAbsenceConfirm(userId, courseId, code, name, Number(hoursStr), today, dbCourses);
      } else {
        showToast('Bu ders bugün yok. Geçmiş devamsızlık için tarih seçin.', 'warning');
      }
    });
  });
}

function renderPastAbsence(container, userId, user, dbCourses) {
  // Quick date helpers
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(yesterday);

  container.innerHTML = `
    <div class="screen">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;" class="animate-fade-in">
        <button id="back-btn" class="btn btn-ghost" style="padding: 8px;">
          ${icon('chevronLeft', 22)}
        </button>
        <div>
          <h1 style="font-size: 20px; font-weight: 800; margin: 0;">Geçmiş Devamsızlık</h1>
        </div>
      </div>

      <!-- Date picker with quick buttons -->
      <div class="card" style="margin-bottom: 16px; padding: 16px;">
        <label style="font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-bottom: 12px;">
          ${icon('calendar', 14)} Tarih Seç
        </label>

        <!-- Quick date buttons -->
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <button class="date-quick-btn active" data-date="${todayStr}">Bugün</button>
          <button class="date-quick-btn" data-date="${yesterdayStr}">Dün</button>
        </div>

        <!-- Date input — large and prominent -->
        <input type="date" id="absence-date" class="input input-date-lg" value="${todayStr}" max="${todayStr}" />
        <div id="date-label" style="text-align: center; font-size: 12px; opacity: 0.5; margin-top: 6px;">
          ${formatDateTR(todayStr)}
        </div>
      </div>

      <div id="courses-for-date" style="display: flex; flex-direction: column; gap: 6px;"></div>
    </div>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => navigate('home'));

  const dateInput = container.querySelector('#absence-date');
  const dateLabel = container.querySelector('#date-label');
  const quickBtns = container.querySelectorAll('.date-quick-btn');

  function selectDate(dateStr) {
    dateInput.value = dateStr;
    dateLabel.textContent = formatDateTR(dateStr);
    // Update quick button active state
    quickBtns.forEach(b => b.classList.toggle('active', b.dataset.date === dateStr));
    loadCoursesForDate(container, userId, user, dbCourses, dateStr);
  }

  // Initial load
  loadCoursesForDate(container, userId, user, dbCourses, todayStr);

  // Quick buttons
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => selectDate(btn.dataset.date));
  });

  // Date input change
  dateInput.addEventListener('change', () => {
    quickBtns.forEach(b => b.classList.remove('active'));
    dateLabel.textContent = formatDateTR(dateInput.value);
    loadCoursesForDate(container, userId, user, dbCourses, dateInput.value);
  });
}

function loadCoursesForDate(container, userId, user, dbCourses, dateStr) {
  const el = container.querySelector('#courses-for-date');
  const schedule = getScheduleForDate(userId, dateStr);
  const date = new Date(dateStr + 'T00:00:00');
  const dayName = getDayName(date);
  const dayNameTR = getDayNameTR(dayName);

  if (schedule.length === 0) {
    el.innerHTML = `
      <div class="card empty-state">
        <div style="opacity: 0.3; margin-bottom: 12px;">${icon('inbox', 40)}</div>
        <p style="font-size: 14px; font-weight: 600; margin: 0;">${dayNameTR} günü ders yok</p>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <p class="section-label">${dayNameTR} &mdash; ${formatDateTR(dateStr)}</p>
    ${schedule.map((lesson, i) => {
    const dbCourse = dbCourses.find(c => c.code === lesson.course);
    return `
        <button class="card card-interactive past-course-btn animate-slide-up stagger-${i + 1}" data-code="${lesson.course}" data-hours="${lesson.hours}" data-name="${lesson.fullName}" data-course-id="${dbCourse?.id || ''}" data-date="${dateStr}" style="display: flex; align-items: center; gap: 12px; padding: 14px; border-left: 4px solid ${dbCourse?.color || 'var(--color-brand)'};">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: ${dbCourse?.color || 'var(--color-brand)'}16; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span style="font-size: 12px; font-weight: 700; color: ${dbCourse?.color || 'var(--color-brand)'};">${lesson.course.slice(0, 3)}</span>
          </div>
          <div style="flex: 1; text-align: left;">
            <div style="font-size: 13px; font-weight: 700;">${lesson.fullName}</div>
            <div style="font-size: 11px; opacity: 0.4; margin-top: 2px;">${lesson.hours}s &middot; ${lesson.time}</div>
          </div>
          ${icon('chevronRight', 16)}
        </button>
      `;
  }).join('')}
  `;

  el.querySelectorAll('.past-course-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showAbsenceConfirm(userId, btn.dataset.courseId, btn.dataset.code, btn.dataset.name, Number(btn.dataset.hours), btn.dataset.date, dbCourses);
    });
  });
}

function showAbsenceConfirm(userId, courseId, code, name, hours, date, dbCourses) {
  const dateTR = formatDateTR(date);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-handle"></div>
      <h3 style="font-size: 17px; font-weight: 700; margin: 0 0 2px;">Devamsızlık Ekle</h3>
      <p style="font-size: 12px; opacity: 0.5; margin: 0 0 16px;">${dateTR}</p>

      <div class="card" style="margin-bottom: 14px; border-left: 4px solid var(--color-danger);">
        <div style="font-size: 14px; font-weight: 700;">${name}</div>
        <div style="font-size: 12px; opacity: 0.5; margin-top: 3px;">${code} &middot; ${hours} saat eklenecek</div>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 5px; margin-bottom: 6px;">
          ${icon('filePen', 13)} Not (opsiyonel)
        </label>
        <input type="text" id="absence-note" class="input" placeholder="Neden katılmadınız?" />
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="btn btn-outline" id="modal-cancel" style="flex: 1;">İptal</button>
        <button class="btn btn-danger" id="modal-confirm" style="flex: 1;">
          ${icon('xCircle', 14)} ${hours}s Ekle
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#modal-confirm').addEventListener('click', async () => {
    const note = overlay.querySelector('#absence-note').value.trim() || null;
    const existing = await checkDuplicateAbsence(userId, code, date);
    if (existing) { overlay.remove(); showToast('Bu tarih için zaten var', 'warning'); return; }

    try {
      await addAbsence(userId, courseId, code, date, hours, note);
      overlay.remove();
      haptic('success');
      showToast('Devamsızlık kaydedildi', 'success');
      navigate('home');
    } catch (err) {
      overlay.remove();
      haptic('error');
      showToast('Kayıt başarısız: ' + err.message, 'error');
    }
  });
}
