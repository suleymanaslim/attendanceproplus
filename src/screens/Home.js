import { store, toggleTheme, showToast, showConfirm, haptic } from '../store.js';
import { getUser, getTodaySchedule, getTodayTR, getDayName, formatDate, getScheduleForDate } from '../data/users.js';
import { getCourses, getAbsences, getTotalAbsenceHours, addAbsence, deleteAbsence, checkDuplicateAbsence, initCoursesForUser } from '../db/database.js';
import { icon } from '../icons.js';
import { navigate } from '../app.js';
import { showInstallPrompt } from '../install.js';

// No debug functions needed

export async function renderHome(container) {
  const userId = store.get('currentUser');
  const user = getUser(userId);
  if (!user) { navigate('login'); return; }

  await initCoursesForUser(userId, user.courses);

  const effectiveToday = new Date();
  const todayStr = formatDate(effectiveToday);
  const dayName = getDayName(effectiveToday);
  const isWeekend = dayName === 'saturday' || dayName === 'sunday';

  // Always use real schedule
  const todaySchedule = getTodaySchedule(userId);
  const todayTR = getTodayTR();

  const dbCourses = await getCourses(userId);
  const allAbsences = await getAbsences(userId);

  // Check today's absences to know which courses are already marked
  const todayAbsences = allAbsences.filter(a => a.date === todayStr);
  const todayAbsenceMap = {};
  todayAbsences.forEach(a => { todayAbsenceMap[a.courseCode] = a; });

  const courseAbsenceData = {};
  let criticalCount = 0, warningCount = 0, safeCount = 0;

  for (const course of dbCourses) {
    const totalAbsent = await getTotalAbsenceHours(userId, course.code);
    const limit = course.absenceLimit;
    let maxAbsenceHours = Math.floor(0.30 * course.semesterTotalHours);
    if (limit && limit.value > 0) {
      maxAbsenceHours = limit.type === 'percent'
        ? Math.floor((limit.value / 100) * course.semesterTotalHours)
        : limit.value;
    }
    const percentage = maxAbsenceHours > 0 ? Math.min((totalAbsent / maxAbsenceHours) * 100, 100) : 0;
    const remaining = Math.max(0, maxAbsenceHours - totalAbsent);

    if (percentage >= 80) criticalCount++;
    else if (percentage >= 50) warningCount++;
    else safeCount++;

    courseAbsenceData[course.code] = { totalAbsent, maxAbsenceHours, percentage, remaining, dbCourse: course };
  }

  container.innerHTML = `
    <div class="screen">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border);" class="animate-fade-in">
        <div style="display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0;">
          <img src="/icons/logo.png" alt="Logo" style="width: 64px; height: 64px; object-fit: contain; display: block; flex-shrink: 0;" />
          <div style="min-width: 0;">
            <h1 style="font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.02em; overflow: hidden; text-overflow: ellipsis; color: var(--text);">Merhaba, ${user.name.split(' ')[0]}</h1>
            <p style="font-size: 13px; color: var(--muted); margin: 2px 0 0; font-weight: 500;">${todayTR}</p>
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center; margin-left: 8px;">
          <button id="theme-toggle" class="btn btn-ghost" style="width: 40px; height: 40px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--card-bg); border: 1px solid var(--border);">
            ${store.get('theme') === 'dark' ? icon('sun', 20) : icon('moon', 20)}
          </button>
        </div>
      </div>

      <!-- Summary -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px;">
        <div class="status-card status-card-success animate-slide-up stagger-1">
          <div style="font-size: 28px; font-weight: 800; color: var(--color-success);">${safeCount}</div>
          <div style="font-size: 11px; color: var(--color-success); font-weight: 600; margin-top: 2px; display: flex; align-items: center; gap: 4px; justify-content: center;">${icon('shieldCheck', 12)} Güvenli</div>
        </div>
        <div class="status-card status-card-warning animate-slide-up stagger-2 go-stats-btn" style="cursor: pointer; transition: transform 0.15s ease;" data-filter="warning">
          <div style="font-size: 28px; font-weight: 800; color: var(--color-warning);">${warningCount}</div>
          <div style="font-size: 11px; color: var(--color-warning); font-weight: 600; margin-top: 2px; display: flex; align-items: center; gap: 4px; justify-content: center;">${icon('alertTriangle', 12)} Dikkat</div>
        </div>
        <div class="status-card status-card-danger animate-slide-up stagger-3 go-stats-btn" style="cursor: pointer; transition: transform 0.15s ease;" data-filter="critical">
          <div style="font-size: 28px; font-weight: 800; color: var(--color-danger);">${criticalCount}</div>
          <div style="font-size: 11px; color: var(--color-danger); font-weight: 600; margin-top: 2px; display: flex; align-items: center; gap: 4px; justify-content: center;">${icon('xCircle', 12)} Kritik</div>
        </div>
      </div>

      <!-- Today's Courses -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        ${icon('book', 16)}
        <h2 style="font-size: 16px; font-weight: 700; margin: 0;">
          ${isWeekend ? 'Hafta Sonu' : 'Bugünün Dersleri'}
        </h2>
      </div>

      ${isWeekend ? `
        <div class="card empty-state">
          <div style="opacity: 0.3; margin-bottom: 12px;">${icon('sparkles', 40)}</div>
          <p style="font-size: 15px; font-weight: 600; margin: 0 0 4px;">Bugün ders yok</p>
          <p style="font-size: 12px; color: var(--muted); margin: 0;">İyi tatiller</p>
        </div>
      ` : todaySchedule.length === 0 ? `
        <div class="card empty-state">
          <div style="opacity: 0.3; margin-bottom: 12px;">${icon('checkCircle', 40)}</div>
          <p style="font-size: 15px; font-weight: 600; margin: 0;">Bugün ders yok</p>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${todaySchedule.map((lesson, i) => {
    const data = courseAbsenceData[lesson.course] || { percentage: 0, totalAbsent: 0, remaining: 0, maxAbsenceHours: 0 };
    const statusColor = getStatusColor(data.percentage);
    const courseColor = data.dbCourse?.color || 'var(--color-brand)';
    const isAbsent = !!todayAbsenceMap[lesson.course];
    const absenceRecord = todayAbsenceMap[lesson.course];

    return `
              <div class="card animate-slide-up stagger-${Math.min(i + 4, 8)} ${data.percentage >= 80 && !isAbsent ? 'animate-danger-pulse' : ''}" style="padding: 0; border-left: 4px solid ${courseColor}; overflow: hidden;">
                <!-- Card body -->
                <div style="padding: 16px;">
                  <!-- Top: course code + time -->
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 700; color: ${courseColor}; letter-spacing: 0.03em;">${lesson.course}</span>
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--muted);">
                      <span style="display: flex; align-items: center; gap: 3px;">${icon('clock', 11)} ${lesson.time}</span>
                      <span style="display: flex; align-items: center; gap: 3px;">${icon('mapPin', 11)} ${lesson.room}</span>
                    </div>
                  </div>

                  <!-- Course name — FULL, no truncation -->
                  <h3 style="font-size: 15px; font-weight: 700; margin: 0 0 10px; line-height: 1.4;">${lesson.fullName}</h3>

                  <!-- Progress -->
                  <div style="margin-bottom: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 4px;">
                      <span style="color: var(--muted);">${data.totalAbsent}s / ${data.maxAbsenceHours}s kullanıldı</span>
                      <span style="font-weight: 700; color: ${statusColor};">${Math.round(data.percentage)}%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${data.percentage}%; background: linear-gradient(90deg, ${statusColor}, ${getStatusColorLight(data.percentage)});"></div>
                    </div>
                  </div>

                  <!-- Remaining hours -->
                  <div style="font-size: 12px; font-weight: 600; margin-bottom: 12px; ${data.remaining > 0 ? 'color: var(--muted);' : 'color: var(--color-danger);'}">
                    ${data.remaining > 0
        ? `${icon('shieldCheck', 12)} ${data.remaining} saat hakkınız kaldı`
        : `${icon('alertTriangle', 12)} Limit doldu!`}
                  </div>

                  <!-- Action button -->
                  ${isAbsent ? `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 8px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.12);">
                      <div style="display: flex; align-items: center; gap: 8px; color: var(--color-danger); font-size: 13px; font-weight: 600;">
                        ${icon('xCircle', 15)} Katılmadınız — ${absenceRecord.hours}s
                      </div>
                      <button class="btn btn-ghost undo-absence-btn" data-id="${absenceRecord.id}" style="padding: 6px; color: var(--color-danger);" title="Geri al">
                        ${icon('x', 16)}
                      </button>
                    </div>
                  ` : `
                    <button class="btn absence-quick-btn" data-course="${lesson.course}" data-hours="${lesson.hours}" data-name="${lesson.fullName}" style="width: 100%; padding: 10px; border-radius: 8px; background: rgba(239,68,68,0.06); color: var(--color-danger); border: 1px solid rgba(239,68,68,0.12); font-size: 13px; font-weight: 600; gap: 6px;">
                      ${icon('xCircle', 15)} Katılmadım
                    </button>
                  `}
                </div>
              </div>
            `;
  }).join('')}
        </div>
      `}

      <!-- Actions -->
      <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 8px;">
        <button id="add-absence-btn" class="btn btn-primary btn-lg" style="width: 100%;">
          ${icon('plus', 18)} Devamsızlık Ekle
        </button>
        <button id="past-absence-btn" class="btn btn-outline" style="width: 100%; padding: 12px;">
          ${icon('calendarClock', 16)} Geçmiş Devamsızlık Ekle
        </button>
      </div>
    </div>
  `;

  // Events
  container.querySelector('#theme-toggle')?.addEventListener('click', () => { toggleTheme(); renderHome(container); });
  container.querySelector('#add-absence-btn')?.addEventListener('click', () => navigate('absence'));
  container.querySelector('#past-absence-btn')?.addEventListener('click', () => navigate('absence', { mode: 'past' }));

  // Navigate to stats on Dikkat/Kritik tap
  container.querySelectorAll('.go-stats-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      haptic('light');
      navigate('stats');
    });
  });

  // Quick absence — mark as absent
  container.querySelectorAll('.absence-quick-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const courseCode = btn.dataset.course;
      const hours = Number(btn.dataset.hours);
      const courseName = btn.dataset.name;
      const today = formatDate(new Date());

      const existing = await checkDuplicateAbsence(userId, courseCode, today);
      if (existing) { showToast('Bu ders için bugün zaten girilmiş', 'warning'); return; }

      showConfirm('Devamsızlık Kaydet', `${courseName} dersine ${hours} saat devamsızlık eklenecek.`, async () => {
        const dbCourse = dbCourses.find(c => c.code === courseCode);
        const result = await addAbsence(userId, dbCourse?.id, courseCode, today, hours);
        if (result) { haptic('success'); showToast('Devamsızlık kaydedildi', 'success'); renderHome(container); }
        else { haptic('error'); showToast('Kayıt başarısız', 'error'); }
      });
    });
  });

  // Undo absence — X button
  container.querySelectorAll('.undo-absence-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      showConfirm('Geri Al', 'Devamsızlık kaydı geri alınacak. Emin misiniz?', async () => {
        const success = await deleteAbsence(id);
        if (success) { haptic('light'); showToast('Geri alındı', 'success'); renderHome(container); }
        else { haptic('error'); showToast('Başarısız', 'error'); }
      });
    });
  });

  setTimeout(() => showInstallPrompt(), 1500);
}

function getStatusColor(p) {
  if (p >= 80) return 'var(--color-danger)';
  if (p >= 50) return 'var(--color-warning)';
  return 'var(--color-success)';
}

function getStatusColorLight(p) {
  if (p >= 80) return 'var(--color-danger-light)';
  if (p >= 50) return 'var(--color-warning-light)';
  return 'var(--color-success-light)';
}
