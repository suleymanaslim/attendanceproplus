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

  // Calculate total weekly hours and unique courses
  let totalWeeklyLessons = 0;
  const allCourseCodes = new Set();
  days.forEach(day => {
    const schedule = user.schedule[day] || [];
    totalWeeklyLessons += schedule.length;
    schedule.forEach(l => allCourseCodes.add(l.course));
  });

  const totalAbsentHoursWeek = absences.reduce((sum, a) => sum + a.hours, 0);

  container.innerHTML = `
    <div class="screen">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;" class="animate-fade-in">
        ${icon('calendar', 20)}
        <h1 style="font-size: 22px; font-weight: 800; margin: 0;">Haftalık Program</h1>
      </div>

      <!-- Summary row -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px;">
        <div class="animate-slide-up stagger-1" style="flex: 1; border-radius: 14px; padding: 14px; text-align: center; background: linear-gradient(135deg, rgba(26, 140, 216, 0.12), rgba(26, 140, 216, 0.04));">
          <div style="font-size: 22px; font-weight: 800; color: var(--color-brand);">${allCourseCodes.size}</div>
          <div style="font-size: 10px; color: var(--color-brand); font-weight: 600; margin-top: 2px;">Ders</div>
        </div>
        <div class="animate-slide-up stagger-2" style="flex: 1; border-radius: 14px; padding: 14px; text-align: center; background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.04));">
          <div style="font-size: 22px; font-weight: 800; color: var(--color-success);">${totalWeeklyLessons}</div>
          <div style="font-size: 10px; color: var(--color-success); font-weight: 600; margin-top: 2px;">Haftalık Seans</div>
        </div>
        <div class="animate-slide-up stagger-3" style="flex: 1; border-radius: 14px; padding: 14px; text-align: center; background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.04));">
          <div style="font-size: 22px; font-weight: 800; color: ${totalAbsentHoursWeek > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">${totalAbsentHoursWeek}</div>
          <div style="font-size: 10px; color: ${totalAbsentHoursWeek > 0 ? 'var(--color-danger)' : 'var(--color-success)'}; font-weight: 600; margin-top: 2px;">Devamsız Saat</div>
        </div>
      </div>

      <!-- Days -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${days.map((day, dayIdx) => {
    const schedule = user.schedule[day] || [];
    const isToday = day === todayKey;
    const dayAbsences = absences.filter(a => {
      const d = new Date(a.date + 'T00:00:00');
      return getDayName(d) === day;
    });
    const absenceCourses = new Set(dayAbsences.map(a => a.courseCode));
    const totalAbsentHours = dayAbsences.reduce((sum, a) => sum + a.hours, 0);

    return `
          <div class="animate-slide-up stagger-${Math.min(dayIdx + 4, 8)}" style="border-radius: 14px; overflow: hidden; ${isToday ? 'background: rgba(26, 140, 216, 0.04); border: 1px solid rgba(26, 140, 216, 0.15);' : 'background: var(--card-bg); border: 1px solid var(--border);'} cursor: pointer;" data-day-toggle="${day}">
            <!-- Day header -->
            <div style="padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                ${isToday
        ? `<div style="width: 32px; height: 32px; border-radius: 8px; background: var(--color-brand); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 800; flex-shrink: 0;">${getDayNameTR(day).slice(0, 2)}</div>`
        : `<div style="width: 32px; height: 32px; border-radius: 8px; background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--muted); flex-shrink: 0;">${getDayNameTR(day).slice(0, 2)}</div>`
      }
                <div>
                  <div style="font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    ${getDayNameTR(day)}
                    ${isToday ? '<span class="badge badge-brand" style="font-size: 9px; padding: 2px 6px;">Bugün</span>' : ''}
                  </div>
                  <div style="font-size: 11px; color: var(--muted); margin-top: 1px;">
                    ${schedule.length} ders${totalAbsentHours > 0 ? ` · <span style="color: var(--color-danger); font-weight: 600;">${totalAbsentHours}s devamsız</span>` : ''}
                  </div>
                </div>
              </div>
              <span class="day-chevron" style="transition: transform 0.25s ease; display: flex; color: var(--muted); ${isToday ? 'transform: rotate(180deg);' : ''}">${icon('chevronDown', 16)}</span>
            </div>

            <!-- Lessons panel -->
            <div class="day-lessons-panel" style="${isToday ? '' : 'max-height: 0; overflow: hidden;'} transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);">
              ${schedule.length === 0 ? `
                <div style="padding: 16px; text-align: center; font-size: 12px; color: var(--muted); border-top: 1px solid var(--border);">Ders yok</div>
              ` : `
                <div style="border-top: 1px solid ${isToday ? 'rgba(26, 140, 216, 0.1)' : 'var(--border)'};">
                  ${schedule.map((lesson, li) => {
        const color = lesson.color || dbCourses.find(c => c.code === lesson.course)?.color || 'var(--color-brand)';
        const hasAbsence = absenceCourses.has(lesson.course);
        return `
                    <div style="padding: 10px 16px; display: flex; align-items: center; gap: 12px; ${li > 0 ? 'border-top: 1px solid var(--border);' : ''} ${hasAbsence ? 'opacity: 0.5;' : ''}">
                      <div style="width: 4px; height: 28px; border-radius: 2px; background: ${color}; flex-shrink: 0;"></div>
                      <div style="width: 42px; flex-shrink: 0;">
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
                      ${hasAbsence
            ? `<span class="badge badge-danger" style="font-size: 9px; flex-shrink: 0;">${icon('xCircle', 9)} Devamsız</span>`
            : `<span style="font-size: 10px; color: var(--muted);">${lesson.hours}s</span>`
          }
                    </div>`;
      }).join('')}
                </div>
              `}
            </div>
          </div>`;
  }).join('')}
      </div>

      <!-- Course legend (compact) -->
      <div style="margin-top: 16px; border-radius: 14px; padding: 14px 16px; background: var(--card-bg); border: 1px solid var(--border);">
        <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 0 0 10px;">Dersler</p>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${Object.entries(user.courses).map(([code, course]) => {
    const color = dbCourses.find(c => c.code === code)?.color || 'var(--color-brand)';
    const totalAbsent = absences.filter(a => a.courseCode === code).reduce((sum, a) => sum + a.hours, 0);
    return `
              <div style="display: flex; align-items: center; gap: 5px; font-size: 11px; padding: 5px 10px; border-radius: 8px; background: ${color}0d; border: 1px solid ${color}15;">
                <div style="width: 6px; height: 6px; border-radius: 2px; background: ${color};"></div>
                <span style="font-weight: 600;">${code}</span>
                <span style="color: var(--muted);">${course.weeklyHours}s</span>
                ${totalAbsent > 0 ? `<span style="color: var(--color-danger); font-weight: 600;">${totalAbsent}s</span>` : ''}
              </div>`;
  }).join('')}
        </div>
      </div>
    </div>
  `;

  // Accordion toggle with smooth animation
  container.querySelectorAll('[data-day-toggle]').forEach(dayCard => {
    dayCard.addEventListener('click', () => {
      const panel = dayCard.querySelector('.day-lessons-panel');
      const chevron = dayCard.querySelector('.day-chevron');
      const isOpen = !panel.style.maxHeight || panel.style.maxHeight !== '0px';

      if (panel.style.maxHeight === '0px' || panel.style.maxHeight === '') {
        // Open
        panel.style.maxHeight = panel.scrollHeight + 'px';
        panel.style.overflow = 'hidden';
        chevron.style.transform = 'rotate(180deg)';
      } else {
        // Close
        panel.style.maxHeight = '0px';
        panel.style.overflow = 'hidden';
        chevron.style.transform = '';
      }
    });
  });

  // Set initial maxHeight for today's open panel
  container.querySelectorAll('.day-lessons-panel').forEach(panel => {
    if (!panel.style.maxHeight && panel.style.maxHeight !== '0px') {
      // Today's panel is open — set explicit maxHeight for animation
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  });
}
