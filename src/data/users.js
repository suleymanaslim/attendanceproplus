// ===== USER DATA (Hardcoded) =====

export const USERS = {
    user1: {
        id: "user1",
        name: "Hüseyin Aslım",
        schedule: {
            monday: [
                { course: "MAT152", fullName: "MATEMATİKSEL ANALİZ II", hours: 3, time: "09:00-11:50", room: "F-511" }
            ],
            tuesday: [
                { course: "BIL386", fullName: "YAZILIM MÜHENDİSLİĞİNE GİRİŞ", hours: 3, time: "09:00-11:50", room: "E-508" },
                { course: "MAT210", fullName: "DOĞRUSAL CEBİR", hours: 2, time: "15:00-16:50", room: "E-507" }
            ],
            wednesday: [
                { course: "MAT250", fullName: "OLASILIK VE İSTATİSTİK", hours: 2, time: "09:00-10:50", room: "E-407" },
                { course: "BIL386", fullName: "YAZILIM MÜHENDİSLİĞİNE GİRİŞ", hours: 2, time: "11:00-12:50", room: "E-508" },
                { course: "MAT152", fullName: "MATEMATİKSEL ANALİZ II", hours: 2, time: "13:00-14:50", room: "F-511" },
                { course: "FIZ110", fullName: "GENEL FİZİK II", hours: 2, time: "15:00-16:50", room: "F-506" }
            ],
            thursday: [
                { course: "MAT250", fullName: "OLASILIK VE İSTATİSTİK", hours: 2, time: "09:00-10:50", room: "E-407" },
                { course: "FIZ110", fullName: "GENEL FİZİK II", hours: 2, time: "15:00-16:50", room: "F-506" }
            ],
            friday: [
                { course: "MAT210", fullName: "DOĞRUSAL CEBİR", hours: 2, time: "11:00-12:50", room: "BELİRSİZ" }
            ]
        },
        courses: {
            MAT152: { code: "MAT152", fullName: "MATEMATİKSEL ANALİZ II", weeklyHours: 5, semesterTotalHours: 75 },
            BIL386: { code: "BIL386", fullName: "YAZILIM MÜHENDİSLİĞİNE GİRİŞ", weeklyHours: 5, semesterTotalHours: 75 },
            MAT210: { code: "MAT210", fullName: "DOĞRUSAL CEBİR", weeklyHours: 4, semesterTotalHours: 60 },
            MAT250: { code: "MAT250", fullName: "OLASILIK VE İSTATİSTİK", weeklyHours: 4, semesterTotalHours: 60 },
            FIZ110: { code: "FIZ110", fullName: "GENEL FİZİK II", weeklyHours: 4, semesterTotalHours: 60 }
        }
    },
    user2: {
        id: "user2",
        name: "Süleyman Aslım",
        schedule: {
            monday: [
                { course: "MBZ304", fullName: "TÜRK EĞİTİM SİSTEMİ VE OKUL YÖNETİMİ", hours: 2, time: "10:30-12:20", room: "A9[90]" }
            ],
            tuesday: [
                { course: "MBZ303", fullName: "EĞİTİMDE ÖLÇME VE DEĞERLENDİRME", hours: 2, time: "08:30-10:20", room: "B1[90]" },
                { course: "INS004", fullName: "AE SEÇ: İNGİLİZCE DERS KİTABI İNCELEMESİ", hours: 2, time: "10:30-12:20", room: "B12[90]" },
                { course: "INZ304", fullName: "İNGİLİZCE DİL BECERİLERİNİN ÖĞRETİMİ 2", hours: 3, time: "12:30-15:20", room: "FARABİ[90]" }
            ],
            wednesday: [
                { course: "INZ302", fullName: "ÇOCUKLARA YABANCI DİL ÖĞRETİMİ 2", hours: 3, time: "08:30-11:20", room: "A6[90]" },
                { course: "INZ306", fullName: "DİL VE EDEBİYAT ÖĞRETİMİ 2", hours: 2, time: "12:30-14:20", room: "A6[90]" }
            ],
            thursday: [
                { course: "MBS013", fullName: "MB SEÇ: KAPSAYICI EĞİTİM", hours: 2, time: "13:30-15:20", room: "A4[90]" },
                { course: "GKS011", fullName: "GK SEÇ: MEDYA OKURYAZARLIĞI", hours: 2, time: "15:30-17:20", room: "A2[90]" }
            ],
            friday: []
        },
        courses: {
            MBZ304: { code: "MBZ304", fullName: "TÜRK EĞİTİM SİSTEMİ VE OKUL YÖNETİMİ", weeklyHours: 2, semesterTotalHours: 30 },
            MBZ303: { code: "MBZ303", fullName: "EĞİTİMDE ÖLÇME VE DEĞERLENDİRME", weeklyHours: 2, semesterTotalHours: 30 },
            INS004: { code: "INS004", fullName: "AE SEÇ: İNGİLİZCE DERS KİTABI İNCELEMESİ", weeklyHours: 2, semesterTotalHours: 30 },
            INZ304: { code: "INZ304", fullName: "İNGİLİZCE DİL BECERİLERİNİN ÖĞRETİMİ 2", weeklyHours: 3, semesterTotalHours: 45 },
            INZ302: { code: "INZ302", fullName: "ÇOCUKLARA YABANCI DİL ÖĞRETİMİ 2", weeklyHours: 3, semesterTotalHours: 45 },
            INZ306: { code: "INZ306", fullName: "DİL VE EDEBİYAT ÖĞRETİMİ 2", weeklyHours: 2, semesterTotalHours: 30 },
            MBS013: { code: "MBS013", fullName: "MB SEÇ: KAPSAYICI EĞİTİM", weeklyHours: 2, semesterTotalHours: 30 },
            GKS011: { code: "GKS011", fullName: "GK SEÇ: MEDYA OKURYAZARLIĞI", weeklyHours: 2, semesterTotalHours: 30 }
        }
    }
};

// ===== HELPER FUNCTIONS =====

const DAY_MAP = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
    4: 'thursday', 5: 'friday', 6: 'saturday'
};

const DAY_NAMES_TR = {
    monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
    thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar'
};

export function getUser(userId) {
    return USERS[userId] || null;
}

export function getDayName(date = new Date()) {
    return DAY_MAP[date.getDay()];
}

export function getDayNameTR(dayKey) {
    return DAY_NAMES_TR[dayKey] || dayKey;
}

export function getScheduleForDay(userId, dayName) {
    const user = USERS[userId];
    if (!user || !user.schedule[dayName]) return [];
    return user.schedule[dayName];
}

export function getScheduleForDate(userId, dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const dayName = getDayName(date);
    return getScheduleForDay(userId, dayName);
}

export function getAllCourses(userId) {
    const user = USERS[userId];
    if (!user) return {};
    return user.courses;
}

export function getTodaySchedule(userId) {
    const today = getDayName();
    return getScheduleForDay(userId, today);
}

export function getTomorrowSchedule(userId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayName = getDayName(tomorrow);
    return getScheduleForDay(userId, dayName);
}

export function getAllScheduleFlat(userId) {
    const user = USERS[userId];
    if (!user) return [];
    const result = [];
    const seen = new Set();
    for (const [day, courses] of Object.entries(user.schedule)) {
        for (const course of courses) {
            if (!seen.has(course.course)) {
                seen.add(course.course);
                result.push({
                    ...course,
                    weeklyHours: user.courses[course.course]?.weeklyHours,
                    semesterTotalHours: user.courses[course.course]?.semesterTotalHours
                });
            }
        }
    }
    return result;
}

export function formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
}

export function formatDateTR(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function getTodayTR() {
    const now = new Date();
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}
