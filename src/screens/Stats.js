import { store, showToast, showConfirm, haptic } from '../store.js';
import { getUser, formatDateTR, getDayNameTR, getDayName } from '../data/users.js';
import { getCourses, getAbsences, getTotalAbsenceHours, deleteAbsence } from '../db/database.js';
import { icon } from '../icons.js';
import { navigate } from '../app.js';

export async function renderStats(container) {
  const userId = store.get('currentUser');
  const user = getUser(userId);
  if (!user) { navigate('login'); return; }

  const dbCourses = await getCourses(userId);
  const allAbsences = await getAbsences(userId);

  const courseStats = [];
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
    const courseAbsences = allAbsences.filter(a => a.courseCode === course.code);
    const status = percentage >= 80 ? 'critical' : percentage >= 50 ? 'warning' : 'safe';
    courseStats.push({ ...course, totalAbsent, maxAbsenceHours, percentage, remaining, absences: courseAbsences, status });
  }

  // Sort: critical first, then warning, then safe — within each group by percentage desc
  courseStats.sort((a, b) => {
    const order = { critical: 0, warning: 1, safe: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return b.percentage - a.percentage;
  });

  const totalAbsentAll = courseStats.reduce((sum, c) => sum + c.totalAbsent, 0);
  const criticalCourses = courseStats.filter(c => c.status === 'critical');
  const warningCourses = courseStats.filter(c => c.status === 'warning');
  const safeCourses = courseStats.filter(c => c.status === 'safe');

  container.innerHTML = `
    <div class="screen">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;" class="animate-fade-in">
        ${icon('barChart', 20)}
        <h1 style="font-size: 22px; font-weight: 800; margin: 0;">İstatistikler</h1>
      </div>

      <!-- Summary — redesigned, no borders -->
      <div style="display: flex; gap: 8px; margin-bottom: 24px;">
        <div class="animate-slide-up stagger-1" style="flex: 1; border-radius: 14px; padding: 16px; text-align: center; background: linear-gradient(135deg, rgba(26, 140, 216, 0.12), rgba(26, 140, 216, 0.04));">
          <div style="font-size: 26px; font-weight: 800; color: var(--color-brand);">${totalAbsentAll}</div>
          <div style="font-size: 10px; color: var(--color-brand); font-weight: 600; margin-top: 4px;">Toplam Saat</div>
        </div>
        <div class="animate-slide-up stagger-2" style="flex: 1; border-radius: 14px; padding: 16px; text-align: center; background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04));">
          <div style="font-size: 26px; font-weight: 800; color: var(--color-warning);">${warningCourses.length}</div>
          <div style="font-size: 10px; color: var(--color-warning); font-weight: 600; margin-top: 4px;">Dikkat</div>
        </div>
        <div class="animate-slide-up stagger-3" style="flex: 1; border-radius: 14px; padding: 16px; text-align: center; background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.04));">
          <div style="font-size: 26px; font-weight: 800; color: var(--color-danger);">${criticalCourses.length}</div>
          <div style="font-size: 10px; color: var(--color-danger); font-weight: 600; margin-top: 4px;">Kritik</div>
        </div>
      </div>

      ${criticalCourses.length > 0 ? `
        <!-- CRITICAL SECTION — eye-catching -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
            ${icon('alertTriangle', 14)}
            <h3 style="font-size: 14px; font-weight: 700; margin: 0; color: var(--color-danger);">Kritik Dersler</h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${criticalCourses.map((course, i) => renderCourseCard(course, i, 'critical')).join('')}
          </div>
        </div>
      ` : ''}

      ${warningCourses.length > 0 ? `
        <!-- WARNING SECTION -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
            ${icon('alertTriangle', 14)}
            <h3 style="font-size: 14px; font-weight: 700; margin: 0; color: var(--color-warning);">Dikkat Edilmesi Gereken</h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${warningCourses.map((course, i) => renderCourseCard(course, i + criticalCourses.length, 'warning')).join('')}
          </div>
        </div>
      ` : ''}

      ${safeCourses.length > 0 ? `
        <!-- SAFE SECTION -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
            ${icon('shieldCheck', 14)}
            <h3 style="font-size: 14px; font-weight: 700; margin: 0; color: var(--color-success);">Güvenli</h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${safeCourses.map((course, i) => renderCourseCard(course, i + criticalCourses.length + warningCourses.length, 'safe')).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Course card expand/collapse with smooth animation
  container.querySelectorAll('[data-course-detail]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.delete-absence-btn')) return;

      const panel = card.querySelector('.course-detail-panel');
      const chevron = card.querySelector('.detail-chevron');
      const isOpen = panel.style.maxHeight && panel.style.maxHeight !== '0px';

      // Close all others
      container.querySelectorAll('.course-detail-panel').forEach(p => {
        p.style.maxHeight = '0px';
        p.style.padding = '0 14px';
        p.style.borderTopColor = 'transparent';
      });
      container.querySelectorAll('.detail-chevron').forEach(c => { c.style.transform = ''; });

      if (!isOpen) {
        panel.style.maxHeight = panel.scrollHeight + 24 + 'px';
        panel.style.padding = '12px 14px';
        panel.style.borderTopColor = 'var(--border)';
        chevron.style.transform = 'rotate(180deg)';
      }
    });
  });

  // Delete handlers
  container.querySelectorAll('.delete-absence-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      showConfirm('Devamsızlığı Sil', 'Bu kayıt silinecek. Emin misiniz?', async () => {
        const success = await deleteAbsence(id);
        if (success) { haptic('light'); showToast('Silindi', 'success'); renderStats(container); }
        else { haptic('error'); showToast('Silme başarısız', 'error'); }
      });
    });
  });
}

function renderCourseCard(course, index, status) {
  const statusConfig = {
    critical: {
      bg: 'rgba(239, 68, 68, 0.05)',
      border: 'rgba(239, 68, 68, 0.2)',
      glow: '0 0 0 1px rgba(239, 68, 68, 0.15), 0 4px 12px rgba(239, 68, 68, 0.08)',
      accent: 'var(--color-danger)',
      accentLight: 'var(--color-danger-light)',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.04)',
      border: 'rgba(245, 158, 11, 0.15)',
      glow: '0 0 0 1px rgba(245, 158, 11, 0.1), 0 2px 8px rgba(245, 158, 11, 0.05)',
      accent: 'var(--color-warning)',
      accentLight: 'var(--color-warning-light)',
    },
    safe: {
      bg: 'transparent',
      border: 'var(--border)',
      glow: 'var(--card-shadow)',
      accent: 'var(--color-success)',
      accentLight: 'var(--color-success-light)',
    }
  };

  const cfg = statusConfig[status];

  return `
    <div class="animate-slide-up stagger-${Math.min(index + 4, 8)}" style="border-radius: 14px; overflow: hidden; background: ${cfg.bg}; border: 1px solid ${cfg.border}; box-shadow: ${cfg.glow}; cursor: pointer;" data-course-detail="${course.code}">
      <div style="padding: 16px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: ${course.color}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span style="font-size: 11px; font-weight: 800; color: ${course.color};">${course.code.slice(0, 3)}</span>
            </div>
            <div style="min-width: 0; flex: 1;">
              <div style="font-size: 14px; font-weight: 700; line-height: 1.3;">${course.name}</div>
              <div style="font-size: 10px; color: var(--muted); margin-top: 2px;">${course.code} · ${course.semesterTotalHours}s toplam</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <span style="font-size: 18px; font-weight: 800; color: ${cfg.accent};">${Math.round(course.percentage)}%</span>
            <span class="detail-chevron" style="color: var(--muted); transition: transform 0.2s ease;">${icon('chevronDown', 14)}</span>
          </div>
        </div>

        <!-- Progress -->
        <div style="height: 6px; border-radius: 99px; overflow: hidden; background: var(--border); margin-bottom: 8px;">
          <div style="height: 100%; border-radius: 99px; transition: width 0.6s ease; width: ${course.percentage}%; background: linear-gradient(90deg, ${cfg.accent}, ${cfg.accentLight});"></div>
        </div>

        <!-- Info row -->
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
          <span style="color: var(--muted);">${course.totalAbsent}s / ${course.maxAbsenceHours}s kullanıldı</span>
          <span style="font-weight: 700; color: ${cfg.accent};">
            ${course.remaining > 0 ? course.remaining + ' saat kaldı' : 'LİMİT DOLDU!'}
          </span>
        </div>
      </div>

      <!-- Detail panel (animated) -->
      <div class="course-detail-panel" style="max-height: 0; overflow: hidden; transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.35s ease; padding: 0 14px; background: var(--surface); border-top: 1px solid transparent;">
        ${course.absences.length === 0 ? `
          <p style="font-size: 12px; color: var(--muted); text-align: center; margin: 0;">${icon('checkCircle', 12)} Devamsızlık kaydı yok</p>
        ` : `
          <p style="font-size: 11px; font-weight: 600; color: var(--muted); margin: 0 0 8px;">Devamsızlık Günleri:</p>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${course.absences.map(absence => {
    const d = new Date(absence.date + 'T00:00:00');
    const dayKey = getDayName(d);
    return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 8px; background: var(--card-bg); font-size: 12px;">
                  <div>
                    <span style="font-weight: 600;">${getDayNameTR(dayKey)}</span>
                    <span style="color: var(--muted); margin-left: 6px;">${formatDateTR(absence.date)}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge badge-danger" style="font-size: 10px;">${absence.hours}s</span>
                    <button class="btn btn-ghost delete-absence-btn" data-id="${absence.id}" style="padding: 4px; color: var(--color-danger);">
                      ${icon('trash', 12)}
                    </button>
                  </div>
                </div>
              `;
  }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}
