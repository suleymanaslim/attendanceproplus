import { store } from '../store.js';
import { getUser, getDayNameTR, getDayName } from '../data/users.js';
import { getAbsences, getTotalAbsenceHours, getCourses } from '../db/database.js';
import { icon } from '../icons.js';
import { navigate } from '../app.js';

export async function renderWeeklySchedule(container) {
  const userId = store.get('currentUser');
  const user = getUser(userId);
  if (!user) { navigate('login'); return; }

  const absences = await getAbsences(userId);
  const dbCourses = await getCourses(userId);
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const todayKey = getDayName();
  const dayLabels = { monday: 'Pzt', tuesday: 'Sal', wednesday: 'Çar', thursday: 'Per', friday: 'Cum' };

  // Calculate summary stats
  let totalWeeklyLessons = 0;
  const allCourseCodes = new Set();
  const dayData = {};

  days.forEach(day => {
    const schedule = user.schedule[day] || [];
    totalWeeklyLessons += schedule.length;
    schedule.forEach(l => allCourseCodes.add(l.course));

    const dayAbsences = absences.filter(a => {
      const d = new Date(a.date + 'T00:00:00');
      return getDayName(d) === day;
    });
    const absenceCourses = new Set(dayAbsences.map(a => a.courseCode));
    const totalAbsentHours = dayAbsences.reduce((sum, a) => sum + a.hours, 0);

    dayData[day] = { schedule, dayAbsences, absenceCourses, totalAbsentHours };
  });

  const totalAbsentHoursWeek = absences.reduce((sum, a) => sum + a.hours, 0);
  const initialDay = days.includes(todayKey) ? todayKey : 'monday';

  container.innerHTML = `
    <div class="screen">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;" class="animate-fade-in">
        ${icon('calendar', 20)}
        <h1 style="font-size: 22px; font-weight: 800; margin: 0;">Haftalık Program</h1>
      </div>

      <!-- Summary compact row -->
      <div class="animate-slide-up stagger-1" style="display: flex; gap: 6px; margin-bottom: 16px;">
        <div style="flex: 1; padding: 10px 8px; text-align: center; border-radius: 10px; background: var(--surface);">
          <div style="font-size: 18px; font-weight: 800; color: var(--color-brand);">${allCourseCodes.size}</div>
          <div style="font-size: 9px; color: var(--muted); font-weight: 600; margin-top: 1px;">ders</div>
        </div>
        <div style="flex: 1; padding: 10px 8px; text-align: center; border-radius: 10px; background: var(--surface);">
          <div style="font-size: 18px; font-weight: 800; color: var(--color-success);">${totalWeeklyLessons}</div>
          <div style="font-size: 9px; color: var(--muted); font-weight: 600; margin-top: 1px;">oturum</div>
        </div>
      </div>

      <!-- Horizontal Day Selector -->
      <div class="animate-slide-up stagger-2" style="display: flex; gap: 6px; margin-bottom: 16px;">
        ${days.map(day => {
    const isToday = day === todayKey;
    const isActive = day === initialDay;
    const data = dayData[day];
    return `
            <button class="day-tab" data-day="${day}" style="flex: 1; padding: 10px 4px; border-radius: 12px; border: 1.5px solid ${isActive ? 'var(--color-brand)' : 'var(--border)'}; background: ${isActive ? 'var(--color-brand)' : 'var(--card-bg)'}; cursor: pointer; text-align: center; transition: all 0.25s ease; position: relative;">
              <div style="font-size: 11px; font-weight: 800; color: ${isActive ? 'white' : 'var(--text)'}; letter-spacing: 0.02em;">${dayLabels[day]}</div>
              <div style="font-size: 9px; color: ${isActive ? 'rgba(255,255,255,0.7)' : 'var(--muted)'}; margin-top: 2px;">${data.schedule.length} ders</div>
              ${isToday ? `<div style="width: 4px; height: 4px; border-radius: 50%; background: ${isActive ? 'white' : 'var(--color-brand)'}; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);"></div>` : ''}
            </button>`;
  }).join('')}
      </div>

      <!-- Day Content (dynamic) -->
      <div id="day-content" class="animate-slide-up stagger-3">
        ${renderDayContent(initialDay, dayData[initialDay], dbCourses, todayKey)}
      </div>

      <!-- Course legend (compact) -->
      <div style="margin-top: 14px; border-radius: 12px; padding: 12px 14px; background: var(--surface);">
        <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 0 0 8px;">Dersler</p>
        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
          ${Object.entries(user.courses).map(([code, course]) => {
    const color = dbCourses.find(c => c.code === code)?.color || 'var(--color-brand)';
    const totalAbsent = absences.filter(a => a.courseCode === code).reduce((sum, a) => sum + a.hours, 0);
    return `
              <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; padding: 4px 8px; border-radius: 6px; background: ${color}0d; border: 1px solid ${color}15;">
                <div style="width: 5px; height: 5px; border-radius: 2px; background: ${color};"></div>
                <span style="font-weight: 600;">${code}</span>
                <span style="color: var(--muted);">${course.weeklyHours}s</span>
              </div>`;
  }).join('')}
        </div>
      </div>
    </div>
  `;

  // === Day Tab Switching ===
  const tabs = container.querySelectorAll('.day-tab');
  const contentEl = container.querySelector('#day-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const day = tab.dataset.day;

      // Update tab styles
      tabs.forEach(t => {
        const isActive = t === tab;
        const isToday = t.dataset.day === todayKey;
        t.style.borderColor = isActive ? 'var(--color-brand)' : 'var(--border)';
        t.style.background = isActive ? 'var(--color-brand)' : 'var(--card-bg)';
        t.querySelectorAll('div')[0].style.color = isActive ? 'white' : 'var(--text)';
        t.querySelectorAll('div')[1].style.color = isActive ? 'rgba(255,255,255,0.7)' : 'var(--muted)';
        // Today dot color
        const todayDot = t.querySelector('div[style*="bottom: 4px"]');
        if (todayDot) todayDot.style.background = isActive ? 'white' : 'var(--color-brand)';
      });

      // Animate content swap
      contentEl.style.opacity = '0';
      contentEl.style.transform = 'translateY(8px)';
      setTimeout(() => {
        contentEl.innerHTML = renderDayContent(day, dayData[day], dbCourses, todayKey);
        contentEl.style.opacity = '1';
        contentEl.style.transform = 'translateY(0)';
      }, 150);
    });
  });

  contentEl.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
}

function renderDayContent(day, data, dbCourses, todayKey) {
  const { schedule, totalAbsentHours } = data;
  const isToday = day === todayKey;
  const dayFull = getDayNameTR(day);

  if (schedule.length === 0) {
    return `
      <div style="padding: 40px 20px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 8px;">${day === 'friday' ? '🎉' : '😌'}</div>
        <p style="font-size: 14px; font-weight: 600; margin: 0 0 4px;">${dayFull} — Ders yok</p>
        <p style="font-size: 11px; color: var(--muted); margin: 0;">Bu gün boş!</p>
      </div>
    `;
  }

  return `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
      <span style="font-size: 14px; font-weight: 700;">${dayFull} ${isToday ? '<span style="font-size: 11px; color: var(--color-brand); font-weight: 600;">(Bugün)</span>' : ''}</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px;">
      ${schedule.map((lesson, li) => {
    const color = lesson.color || dbCourses.find(c => c.code === lesson.course)?.color || 'var(--color-brand)';
    return `
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background: var(--card-bg); border: 1px solid var(--border);">
            <div style="width: 4px; height: 32px; border-radius: 2px; background: ${color}; flex-shrink: 0;"></div>
            <div style="width: 44px; flex-shrink: 0;">
              <div style="font-size: 12px; font-weight: 700; color: var(--text);">${lesson.time.split('-')[0]}</div>
              <div style="font-size: 9px; color: var(--muted);">${lesson.time.split('-')[1] || ''}</div>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 13px; font-weight: 600; line-height: 1.3;">${lesson.fullName}</div>
              <div style="font-size: 10px; color: var(--muted); display: flex; gap: 8px; margin-top: 2px;">
                <span>${lesson.course}</span>
                <span style="display: flex; align-items: center; gap: 2px;">${icon('mapPin', 9)} ${lesson.room}</span>
                <span>${lesson.hours}s</span>
              </div>
            </div>
          </div>`;
  }).join('')}
    </div>
  `;
}
