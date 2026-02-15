import Dexie from 'dexie';

const db = new Dexie('AttendanceProPlus');

db.version(1).stores({
    courses: '++id, userId, code, name',
    absences: '++id, userId, courseId, date, [userId+courseId], [userId+date]'
});

// ===== COURSES =====
export async function initCoursesForUser(userId, coursesData) {
    const existing = await db.courses.where('userId').equals(userId).count();
    if (existing > 0) return;

    const coursesToAdd = Object.values(coursesData).map(c => ({
        userId,
        code: c.code,
        name: c.fullName,
        weeklyHours: c.weeklyHours,
        semesterTotalHours: c.semesterTotalHours,
        absenceLimit: { type: 'percent', value: 30 }, // default %30
        color: getRandomColor()
    }));

    try {
        await db.courses.bulkAdd(coursesToAdd);
    } catch (err) {
        console.error('Failed to init courses:', err);
        // Fallback: try one by one
        for (const course of coursesToAdd) {
            try { await db.courses.add(course); } catch (e) { console.error(e); }
        }
    }
}

export async function getCourses(userId) {
    try {
        return await db.courses.where('userId').equals(userId).toArray();
    } catch (err) {
        console.error('Failed to get courses:', err);
        return [];
    }
}

export async function getCourseByCode(userId, code) {
    return await db.courses.where('userId').equals(userId).and(c => c.code === code).first();
}

export async function updateCourseLimit(courseId, limitType, limitValue) {
    try {
        await db.courses.update(courseId, {
            absenceLimit: { type: limitType, value: Number(limitValue) }
        });
        return true;
    } catch (err) {
        console.error('Failed to update course limit:', err);
        return false;
    }
}

// ===== ABSENCES =====
export async function addAbsence(userId, courseId, courseCode, date, hours, note = null) {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const id = await db.absences.add({ userId, courseId, courseCode, date, hours, note, createdAt: new Date().toISOString() });
            return id;
        } catch (err) {
            console.error(`Attempt ${i + 1} failed:`, err);
            if (i === maxRetries - 1) {
                // Fallback to localStorage
                try {
                    const fallback = JSON.parse(localStorage.getItem('absence_fallback') || '[]');
                    fallback.push({ userId, courseId, courseCode, date, hours, note, createdAt: new Date().toISOString() });
                    localStorage.setItem('absence_fallback', JSON.stringify(fallback));
                    return -1; // indicates fallback used
                } catch (e) {
                    throw new Error('Veri kaydedilemedi. Lütfen uygulamayı yeniden başlatın.');
                }
            }
            await new Promise(r => setTimeout(r, 100 * (i + 1)));
        }
    }
}

export async function getAbsences(userId) {
    try {
        return await db.absences.where('userId').equals(userId).reverse().sortBy('date');
    } catch (err) {
        console.error('Failed to get absences:', err);
        return [];
    }
}

export async function getAbsencesForCourse(userId, courseCode) {
    try {
        const all = await db.absences.where('userId').equals(userId).toArray();
        return all.filter(a => a.courseCode === courseCode);
    } catch (err) {
        console.error('Failed to get absences for course:', err);
        return [];
    }
}

export async function getTotalAbsenceHours(userId, courseCode) {
    const absences = await getAbsencesForCourse(userId, courseCode);
    return absences.reduce((sum, a) => sum + a.hours, 0);
}

export async function deleteAbsence(id) {
    try {
        await db.absences.delete(id);
        return true;
    } catch (err) {
        console.error('Failed to delete absence:', err);
        return false;
    }
}

export async function checkDuplicateAbsence(userId, courseCode, date) {
    const all = await db.absences.where('userId').equals(userId).toArray();
    return all.find(a => a.courseCode === courseCode && a.date === date);
}

// ===== EXPORT / IMPORT =====
export async function exportData(userId) {
    const courses = await getCourses(userId);
    const absences = await getAbsences(userId);
    return JSON.stringify({ userId, courses, absences, exportDate: new Date().toISOString() }, null, 2);
}

export async function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (!data.userId || !data.courses || !data.absences) {
            throw new Error('Geçersiz yedek formatı');
        }

        // Clear existing data
        await db.courses.where('userId').equals(data.userId).delete();
        await db.absences.where('userId').equals(data.userId).delete();

        // Import
        await db.courses.bulkAdd(data.courses.map(c => { delete c.id; return c; }));
        await db.absences.bulkAdd(data.absences.map(a => { delete a.id; return a; }));

        return true;
    } catch (err) {
        console.error('Import failed:', err);
        throw err;
    }
}

// ===== SYNC FALLBACK =====
export async function syncFallbackData() {
    const fallback = localStorage.getItem('absence_fallback');
    if (!fallback) return;

    try {
        const items = JSON.parse(fallback);
        for (const item of items) {
            await db.absences.add(item);
        }
        localStorage.removeItem('absence_fallback');
    } catch (err) {
        console.error('Fallback sync failed:', err);
    }
}

// ===== HELPERS =====
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#6366f1'];
let colorIndex = 0;

function getRandomColor() {
    const color = COLORS[colorIndex % COLORS.length];
    colorIndex++;
    return color;
}

export { db };
