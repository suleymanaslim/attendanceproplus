import { store, toggleTheme, showToast, showConfirm, haptic } from '../store.js';
import { getUser, getTodaySchedule, getTodayTR, getDayName, formatDate, getScheduleForDate } from '../data/users.js';
import { getCourses, getAbsences, getTotalAbsenceHours, addAbsence, deleteAbsence, checkDuplicateAbsence, initCoursesForUser } from '../db/database.js';
import { icon } from '../icons.js';
import { navigate } from '../app.js';
import { showInstallPrompt } from '../install.js';

let testDate = null;
function getEffectiveDate() {
  return testDate ? new Date(testDate + 'T12:00:00') : new Date();
}

// Store wheel values per course (persisted during session)
const wheelState = {};

export async function renderHome(container) {
  const userId = store.get('currentUser');
  const user = getUser(userId);
  if (!user) { navigate('login'); return; }

  await initCoursesForUser(userId, user.courses);

  const effectiveToday = getEffectiveDate();
  const todayStr = formatDate(effectiveToday);
  const dayName = getDayName(effectiveToday);
  const isWeekend = dayName === 'saturday' || dayName === 'sunday';

  const todaySchedule = testDate
    ? getScheduleForDate(userId, testDate)
    : getTodaySchedule(userId);
  const todayTR = getTodayTR();

  const dbCourses = await getCourses(userId);
  const allAbsences = await getAbsences(userId);

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

  // Current selected course index
  const savedCourseIdx = store._wheelCourseIdx || 0;

  container.innerHTML = `
    <div class="screen" style="display: flex; flex-direction: column; min-height: calc(100dvh - 80px);">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;" class="animate-fade-in">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
          <img src="/icons/logo.png" alt="Logo" style="width: 40px; height: 40px; object-fit: contain; flex-shrink: 0;" />
          <div style="min-width: 0;">
            <h1 style="font-size: 17px; font-weight: 800; margin: 0; color: var(--text);">Merhaba, ${user.name.split(' ')[0]}</h1>
            <p style="font-size: 11px; color: var(--muted); margin: 2px 0 0;">${testDate ? formatDateTR(effectiveToday) : todayTR}</p>
          </div>
        </div>
        <div style="display: flex; gap: 4px; align-items: center;">
          <button id="date-picker-btn" style="width: 32px; height: 32px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${testDate ? 'var(--color-brand)' : 'var(--card-bg)'}; border: 1px solid ${testDate ? 'var(--color-brand)' : 'var(--border)'}; color: ${testDate ? 'white' : 'var(--text)'}; cursor: pointer;" title="Tarih Seç">${icon('calendarClock', 14)}</button>
          <button id="theme-toggle" style="width: 32px; height: 32px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--card-bg); border: 1px solid var(--border); color: var(--text); cursor: pointer;">
            ${store.get('theme') === 'dark' ? icon('sun', 14) : icon('moon', 14)}
          </button>
        </div>
      </div>

      <!-- Viewing past date banner -->
      ${testDate ? `
        <div class="animate-fade-in" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; margin-bottom: 10px; border-radius: 10px; background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.12); font-size: 12px;">
          <span style="color: var(--color-brand); font-weight: 600; display: flex; align-items: center; gap: 5px;">${icon('calendarClock', 13)} ${formatDateTR(effectiveToday)}</span>
          <button id="back-to-today" style="background: var(--color-brand); color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">Bugüne Dön</button>
        </div>
      ` : ''}

      <!-- Date picker panel -->
      <div id="date-panel" style="display: none; margin-bottom: 12px;">
        <div class="card" style="padding: 12px;">
          <p style="font-size: 11px; font-weight: 600; color: var(--muted); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.04em;">Bu Hafta</p>
          <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            ${(() => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
      let buttons = '';
      for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const ds = formatDate(d);
        const isToday = ds === formatDate();
        const isSelected = ds === testDate;
        buttons += `<button class="week-day-btn" data-date="${ds}" style="flex: 1; padding: 8px 4px; border-radius: 8px; border: 1.5px solid ${isSelected ? 'var(--color-brand)' : (isToday ? 'rgba(59,130,246,0.3)' : 'var(--border)')}; background: ${isSelected ? 'var(--color-brand)' : 'var(--card-bg)'}; cursor: pointer; text-align: center;"><div style=\"font-size: 11px; font-weight: 700; color: ${isSelected ? 'white' : 'var(--text)'};\">${dayNames[i]}</div><div style=\"font-size: 10px; color: ${isSelected ? 'rgba(255,255,255,0.7)' : 'var(--muted)'}; margin-top: 1px;\">${d.getDate()}</div>${isToday ? `<div style=\"width: 4px; height: 4px; border-radius: 50%; background: ${isSelected ? 'white' : 'var(--color-brand)'}; margin: 3px auto 0;\"></div>` : ''}</button>`;
      }
      return buttons;
    })()}
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <input type="date" id="custom-date-input" value="${testDate || formatDate()}" class="input" style="flex: 1; padding: 5px 8px; font-size: 12px;" />
            <button id="custom-date-go" class="btn btn-primary" style="padding: 5px 12px; font-size: 11px;">Git</button>
          </div>
        </div>
      </div>

      ${isWeekend || todaySchedule.length === 0 ? `
        <!-- Empty State -->
        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
          <div class="animate-slide-up stagger-1" style="text-align: center; width: 100%; padding: 20px;">
            <div style="font-size: 64px; margin-bottom: 16px;">${isWeekend ? '🏖️' : '😴'}</div>
            <p style="font-size: 20px; font-weight: 800; margin: 0 0 8px;">${isWeekend ? 'Hafta Sonu!' : 'Bugün ders yok'}</p>
            <p style="font-size: 14px; color: var(--muted); margin: 0 0 4px; line-height: 1.5;">${isWeekend ? 'Devamsızlık stresi yok, rahatça uyu 😌' : 'Boş gün, keyfine bak!'}</p>
            <p style="font-size: 11px; color: var(--muted); margin: 8px 0 0; opacity: 0.6;">${isWeekend ? 'Pazartesi görüşürüz... maalesef 🥲' : ''}</p>
          </div>
        </div>
      ` : `
        <!-- MAIN CONTENT -->
        <div style="display: flex; flex-direction: column;">

          <!-- Course Name (above wheel, no code) -->
          <div id="course-header" class="animate-slide-up stagger-1" style="text-align: center; margin-bottom: 16px;">
            <h2 id="course-name" style="font-size: 18px; font-weight: 800; margin: 0; transition: opacity 0.25s;">${todaySchedule[savedCourseIdx]?.fullName || ''}</h2>
          </div>

          <!-- THE WHEEL — hour selector -->
          <div class="animate-slide-up stagger-2" style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 14px;">
            <button id="wheel-prev" style="width: 42px; height: 42px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text); flex-shrink: 0;">
              ${icon('chevronLeft', 20)}
            </button>

            <div id="wheel-area" style="position: relative; width: 180px; height: 180px; flex-shrink: 0;">
              <!-- Outer ring -->
              <div style="position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(59,130,246,0.15);"></div>
              <div class="wheel-pulse-ring" style="position: absolute; inset: -4px; border-radius: 50%; border: 1px solid rgba(59,130,246,0.08);"></div>

              <!-- Rotor -->
              <div id="wheel-rotor" style="position: absolute; inset: 6px; border-radius: 50%; background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0.02)); border: 1px solid rgba(59,130,246,0.1); transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <!-- Hour dots rendered by JS -->
              </div>

              <!-- Center -->
              <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                <div style="width: 62px; height: 62px; border-radius: 50%; background: var(--card-bg); border: 2px solid var(--color-brand); box-shadow: 0 4px 16px rgba(59,130,246,0.12); display: flex; align-items: center; justify-content: center;">
                  <span id="wheel-center" style="font-size: 24px; font-weight: 800; color: var(--color-brand);">✕</span>
                </div>
              </div>

              <!-- Top pointer -->
              <div style="position: absolute; top: -4px; left: 50%; transform: translateX(-50%);">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-brand); box-shadow: 0 2px 6px rgba(59,130,246,0.3);"></div>
              </div>
            </div>

            <button id="wheel-next" style="width: 42px; height: 42px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text); flex-shrink: 0;">
              ${icon('chevronRight', 20)}
            </button>
          </div>

          <!-- Course selector pills (course codes) -->
          <div class="animate-slide-up stagger-3" style="margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 600; color: var(--muted); text-align: center; margin-bottom: 8px;">Bugünün Dersleri</div>
            <div style="display: flex; justify-content: center; gap: 6px; flex-wrap: wrap;">
              ${todaySchedule.map((lesson, i) => {
      const isSaved = !!todayAbsenceMap[lesson.course];
      const isSelected = i === savedCourseIdx;
      const bg = isSelected ? 'var(--color-brand)' : (isSaved ? 'rgba(59,130,246,0.12)' : 'var(--card-bg)');
      const border = isSelected ? 'var(--color-brand)' : (isSaved ? 'var(--color-brand)' : 'var(--border)');
      const clr = isSelected ? 'white' : (isSaved ? 'var(--color-brand)' : 'var(--muted)');
      return `<button class="course-pill" data-index="${i}" style="padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1.5px solid ${border}; cursor: pointer; transition: all 0.25s ease; background: ${bg}; color: ${clr}; letter-spacing: 0.02em;">${lesson.course}</button>`;
    }).join('')}
            </div>
          </div>

          <!-- Course Details Card -->
          <div id="course-details" class="card animate-slide-up stagger-4" style="padding: 16px;">
            <!-- Rendered by JS -->
          </div>


          <!-- Status — at bottom, minimal -->
          <div class="animate-slide-up stagger-5" style="display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px 0; font-size: 11px; color: var(--muted);">
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: var(--color-success); display: inline-block;"></span> <b style="color: var(--color-success);">${safeCount}</b> güvenli</span>
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: var(--color-warning); display: inline-block;"></span> <b style="color: var(--color-warning);">${warningCount}</b> dikkat</span>
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: var(--color-danger); display: inline-block;"></span> <b style="color: var(--color-danger);">${criticalCount}</b> kritik</span>
            <button class="go-stats-btn" style="font-size: 10px; color: var(--color-brand); font-weight: 600; background: none; border: none; cursor: pointer;">→</button>
          </div>
        </div>
      `}
    </div>
  `;

  // === EVENTS ===
  container.querySelector('#theme-toggle')?.addEventListener('click', () => { toggleTheme(); renderHome(container); });

  // Date picker panel toggle
  const datePanel = container.querySelector('#date-panel');
  container.querySelector('#date-picker-btn')?.addEventListener('click', () => {
    datePanel.style.display = datePanel.style.display === 'none' ? 'block' : 'none';
  });

  // Week day quick buttons
  container.querySelectorAll('.week-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.date;
      if (date === formatDate()) {
        testDate = null; // It's today
      } else {
        testDate = date;
      }
      store._wheelCourseIdx = 0;
      renderHome(container);
    });
  });

  // Custom date input
  container.querySelector('#custom-date-go')?.addEventListener('click', () => {
    const val = container.querySelector('#custom-date-input').value;
    if (val) {
      if (val === formatDate()) { testDate = null; } else { testDate = val; }
      store._wheelCourseIdx = 0;
      renderHome(container);
    }
  });

  // Back to today
  container.querySelector('#back-to-today')?.addEventListener('click', () => {
    testDate = null;
    store._wheelCourseIdx = 0;
    renderHome(container);
  });

  container.querySelectorAll('.go-stats-btn').forEach(btn => {
    btn.addEventListener('click', () => { haptic('light'); navigate('stats'); });
  });

  // === WHEEL LOGIC ===
  if (todaySchedule.length > 0 && !isWeekend) {
    let currentCourse = savedCourseIdx;
    const rotor = container.querySelector('#wheel-rotor');
    const centerEl = container.querySelector('#wheel-center');
    const courseNameEl = container.querySelector('#course-name');
    const detailsCard = container.querySelector('#course-details');
    const pills = container.querySelectorAll('.course-pill');

    // Initialize wheel state for each course
    todaySchedule.forEach((lesson, i) => {
      const key = todayStr + '_' + lesson.course;
      if (wheelState[key] == null) {
        // Default to X (-1) = absent. If already saved, mark as -1 too.
        wheelState[key] = -1;
      }
    });

    function buildWheel(courseIdx) {
      const lesson = todaySchedule[courseIdx];
      const hours = lesson.hours; // e.g. 3
      // Items: X (not attended = -1), then 1..hours (attended N hours)
      const items = [-1]; // X
      for (let h = 1; h <= hours; h++) items.push(h);
      const totalItems = items.length;

      const key = todayStr + '_' + lesson.course;
      const currentVal = wheelState[key];
      let selectedIdx = 0; // default to X
      if (currentVal !== null && currentVal !== undefined) {
        selectedIdx = items.indexOf(currentVal);
        if (selectedIdx < 0) selectedIdx = 0;
      }

      // Render dots on rotor
      rotor.innerHTML = items.map((item, i) => {
        const angle = (i * 360) / totalItems;
        const isX = item === -1;
        const isActive = i === selectedIdx;
        const label = isX ? '✕' : item;
        return `
          <div class="wheel-hour-dot" data-dot-idx="${i}" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: flex-start; justify-content: center; padding-top: 6px; transform: rotate(${angle}deg); opacity: ${isActive ? '1' : '0.35'}; transition: opacity 0.3s;">
            <div style="width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${isX ? '14px' : '13px'}; font-weight: 700; ${isActive ? (isX ? 'background: var(--color-danger); color: white;' : 'background: var(--color-brand); color: white; box-shadow: 0 2px 8px rgba(59,130,246,0.3);') : 'background: var(--surface); color: var(--muted); border: 1px solid var(--border);'}">
              ${label}
            </div>
          </div>`;
      }).join('');

      // Rotate rotor to selected position (selected at top)
      const rotation = -selectedIdx * (360 / totalItems);
      rotor.style.transform = `rotate(${rotation}deg)`;

      // Center display
      const val = items[selectedIdx];
      centerEl.textContent = val === -1 ? '✕' : val;
      centerEl.style.color = val === -1 ? 'var(--color-danger)' : 'var(--color-brand)';

      return { items, totalItems, selectedIdx };
    }

    function renderDetails(courseIdx) {
      const lesson = todaySchedule[courseIdx];
      const data = courseAbsenceData[lesson.course] || { percentage: 0, totalAbsent: 0, remaining: 0, maxAbsenceHours: 0 };
      const statusColor = getStatusColor(data.percentage);
      const key = todayStr + '_' + lesson.course;
      const val = wheelState[key];
      const isAbsent = !!todayAbsenceMap[lesson.course];

      detailsCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 12px; color: var(--muted);">
          <span style="display: flex; align-items: center; gap: 4px;">${icon('clock', 12)} ${lesson.time}</span>
          <span style="display: flex; align-items: center; gap: 4px;">${icon('mapPin', 12)} ${lesson.room}</span>
          <span style="font-weight: 600;">${lesson.hours} saat</span>
        </div>
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 11px; color: var(--muted);">Devamsızlık Durumu</span>
            <span style="font-size: 12px; font-weight: 700; color: ${statusColor};">${Math.round(data.percentage)}%</span>
          </div>
          <div class="progress-bar" style="height: 6px;">
            <div class="progress-fill" style="width: ${data.percentage}%; background: ${statusColor}; transition: width 0.5s;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 3px; font-size: 10px; color: var(--muted);">
            <span>${data.totalAbsent}s kullanıldı</span>
            <span>${data.remaining}s kaldı</span>
          </div>
        </div>

        ${isAbsent ? `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 10px; background: rgba(59,130,246,0.04); border: 1px solid rgba(59,130,246,0.12); font-size: 12px;">
            <span style="font-weight: 600; display: flex; align-items: center; gap: 6px; color: var(--text);">
              ${todayAbsenceMap[lesson.course].hours === lesson.hours
            ? `${icon('xCircle', 14)} <span style="color: var(--color-danger);">Katılmadınız</span> <span style="color: var(--muted);">— ${todayAbsenceMap[lesson.course].hours}s</span>`
            : `${icon('checkCircle', 14)} <span style="color: var(--color-success);">Katıldınız</span> <span style="color: var(--muted);">— ${lesson.hours - todayAbsenceMap[lesson.course].hours}/${lesson.hours}s</span>`
          }
            </span>
            <button class="undo-btn" data-id="${todayAbsenceMap[lesson.course].id}" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 4px 0; font-size: 12px; font-weight: 700; white-space: nowrap; text-decoration: underline;">
              Geri Al
            </button>
          </div>
        ` : `
          <button class="save-wheel-btn btn btn-primary" data-course="${lesson.course}" data-name="${lesson.fullName}" style="width: 100%; padding: 10px; font-size: 13px; font-weight: 600; border-radius: 10px;">
            ${val === -1 || val === null || val === undefined ? `${icon('xCircle', 14)} Devamsızlık Kaydet` : (val >= lesson.hours ? `${icon('checkCircle', 14)} Tüm Derse Katıldım` : `${icon('checkCircle', 14)} ${val}/${lesson.hours}s Katıldım — Kaydet`)}
          </button>
        `}
      `;

      // Bind card events
      detailsCard.querySelectorAll('.undo-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = Number(btn.dataset.id);
          showConfirm('Geri Al', 'Devamsızlık kaydı geri alınacak?', async () => {
            const success = await deleteAbsence(id);
            if (success) {
              const key2 = todayStr + '_' + lesson.course;
              wheelState[key2] = null;
              haptic('light'); showToast('Geri alındı', 'success'); renderHome(container);
            } else { haptic('error'); showToast('Başarısız', 'error'); }
          });
        });
      });

      detailsCard.querySelectorAll('.save-wheel-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const courseCode = btn.dataset.course;
          const courseName = btn.dataset.name;
          const lesson2 = todaySchedule.find(l => l.course === courseCode);
          const key2 = todayStr + '_' + courseCode;
          const wheelVal = wheelState[key2];

          if (wheelVal === null || wheelVal === undefined) return;

          // Calculate absence hours: if X → full hours, if N → (total - N) hours absent
          const absentHours = wheelVal === -1 ? lesson2.hours : Math.max(0, lesson2.hours - wheelVal);

          if (absentHours <= 0) {
            showToast('Tüm derse katıldınız, devamsızlık yok', 'success');
            return;
          }

          const existing = await checkDuplicateAbsence(userId, courseCode, todayStr);
          if (existing) { showToast('Zaten girilmiş', 'warning'); return; }

          showConfirm('Devamsızlık Kaydet', `${courseName} — ${absentHours} saat devamsızlık.`, async () => {
            const dbCourse = dbCourses.find(c => c.code === courseCode);
            const result = await addAbsence(userId, dbCourse?.id, courseCode, todayStr, absentHours);
            if (result) { haptic('success'); showToast('Kaydedildi', 'success'); renderHome(container); }
            else { haptic('error'); showToast('Başarısız', 'error'); }
          });
        });
      });
    }

    // --- Build initial state ---
    let wheelData = buildWheel(currentCourse);
    renderDetails(currentCourse);

    function selectCourse(idx) {
      currentCourse = idx;
      store._wheelCourseIdx = idx;

      // Fade course name
      courseNameEl.style.opacity = '0';
      setTimeout(() => {
        courseNameEl.textContent = todaySchedule[idx].fullName;
        courseNameEl.style.opacity = '1';
      }, 120);

      // Update pills (accounting for saved state)
      pills.forEach((p, i) => {
        const isSaved = !!todayAbsenceMap[todaySchedule[i].course];
        const isSelected = i === idx;
        p.style.borderColor = isSelected ? 'var(--color-brand)' : (isSaved ? 'var(--color-brand)' : 'var(--border)');
        p.style.background = isSelected ? 'var(--color-brand)' : (isSaved ? 'rgba(59,130,246,0.12)' : 'var(--card-bg)');
        p.style.color = isSelected ? 'white' : (isSaved ? 'var(--color-brand)' : 'var(--muted)');
      });

      wheelData = buildWheel(idx);
      renderDetails(idx);
      haptic('light');
    }

    function rotateWheel(direction) {
      // Don't rotate if course already saved
      const lesson = todaySchedule[currentCourse];
      if (todayAbsenceMap[lesson.course]) {
        showToast('Bu ders kaydedilmiş. Düzenlemek için geri ala basın.', 'warning');
        return;
      }
      const key = todayStr + '_' + lesson.course;
      const items = wheelData.items;
      let selIdx = wheelData.selectedIdx;

      selIdx += direction;
      if (selIdx < 0) selIdx = items.length - 1;
      if (selIdx >= items.length) selIdx = 0;

      wheelData.selectedIdx = selIdx;
      wheelState[key] = items[selIdx];

      // Animate rotor
      const rotation = -selIdx * (360 / items.length);
      rotor.style.transform = `rotate(${rotation}deg)`;

      // Update center
      const val = items[selIdx];
      centerEl.textContent = val === -1 ? '✕' : val;
      centerEl.style.color = val === -1 ? 'var(--color-danger)' : 'var(--color-brand)';

      // Update dot opacity
      rotor.querySelectorAll('.wheel-hour-dot').forEach((d, i) => {
        d.style.opacity = i === selIdx ? '1' : '0.35';
        const inner = d.firstElementChild;
        if (i === selIdx) {
          const isX = items[i] === -1;
          inner.style.background = isX ? 'var(--color-danger)' : 'var(--color-brand)';
          inner.style.color = 'white';
          inner.style.boxShadow = isX ? 'none' : '0 2px 8px rgba(59,130,246,0.3)';
          inner.style.border = 'none';
        } else {
          inner.style.background = 'var(--surface)';
          inner.style.color = 'var(--muted)';
          inner.style.boxShadow = 'none';
          inner.style.border = '1px solid var(--border)';
        }
      });

      renderDetails(currentCourse);
      haptic('light');
    }

    // Wheel prev/next = rotate hours
    container.querySelector('#wheel-prev')?.addEventListener('click', () => rotateWheel(-1));
    container.querySelector('#wheel-next')?.addEventListener('click', () => rotateWheel(1));

    // Course pills
    pills.forEach(p => p.addEventListener('click', () => selectCourse(Number(p.dataset.index))));

    // Touch swipe on wheel
    let touchStartX = 0;
    const wheelArea = container.querySelector('#wheel-area');
    if (wheelArea) {
      wheelArea.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
      wheelArea.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 30) rotateWheel(diff > 0 ? 1 : -1);
      }, { passive: true });
    }
  }

  setTimeout(() => showInstallPrompt(), 1500);
}

function formatDateTR(date) {
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function getStatusColor(p) {
  if (p >= 80) return 'var(--color-danger)';
  if (p >= 50) return 'var(--color-warning)';
  return 'var(--color-success)';
}
