// Calculations for the Kendra Report: periods, summary, student engagement,
// and mentor / centre activity. Pure functions so the page and the PDF share
// the same numbers.

export const PERIOD_TYPES = [
  { value: "weekly", label: "This week" },
  { value: "monthly", label: "Month" },
  { value: "yearly", label: "Year (Jan–Dec)" },
  { value: "academic", label: "Academic year (Apr–Mar)" },
];

export const LOW_ATTENDANCE = 75;
export const LOW_SCORE = 35;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const toDateOnly = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const round1 = (value) => Math.round(value * 10) / 10;
const mean = (values) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null);

export const currentMonthValue = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

// The academic year that contains `date` starts in April.
export const currentAcademicStart = (date = new Date()) =>
  date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;

export const recentYears = (count = 5, date = new Date()) =>
  Array.from({ length: count }, (_, i) => date.getFullYear() - i);

export const academicLabel = (startYear) => `${startYear}–${String((startYear + 1) % 100).padStart(2, "0")}`;

const weekRange = (anchor) => {
  const day = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + (day === 0 ? -6 : 1 - day));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toDateOnly(monday), to: toDateOnly(sunday), monday };
};

/**
 * Date range for the chosen period, the matching previous period (for the
 * "vs previous" comparison) and how trends are grouped (by day or month).
 */
export const buildPeriod = ({ type, month, year, academicStart }, today = new Date()) => {
  if (type === "monthly") {
    const [y, m] = String(month || currentMonthValue(today)).split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const prevFirst = new Date(y, m - 2, 1);
    return {
      type,
      label: `${MONTH_NAMES[m - 1]} ${y}`,
      from: toDateOnly(first),
      to: toDateOnly(new Date(y, m, 0)),
      prev: { from: toDateOnly(prevFirst), to: toDateOnly(new Date(y, m - 1, 0)), label: `${MONTH_NAMES[prevFirst.getMonth()]} ${prevFirst.getFullYear()}` },
      groupBy: "day",
    };
  }
  if (type === "yearly") {
    const y = Number(year) || today.getFullYear();
    return {
      type,
      label: String(y),
      from: `${y}-01-01`,
      to: `${y}-12-31`,
      prev: { from: `${y - 1}-01-01`, to: `${y - 1}-12-31`, label: String(y - 1) },
      groupBy: "month",
    };
  }
  if (type === "academic") {
    const y = Number(academicStart) || currentAcademicStart(today);
    return {
      type,
      label: `Academic year ${academicLabel(y)}`,
      from: `${y}-04-01`,
      to: `${y + 1}-03-31`,
      prev: { from: `${y - 1}-04-01`, to: `${y}-03-31`, label: academicLabel(y - 1) },
      groupBy: "month",
    };
  }
  const current = weekRange(today);
  const prevAnchor = new Date(current.monday);
  prevAnchor.setDate(prevAnchor.getDate() - 7);
  const previous = weekRange(prevAnchor);
  return {
    type: "weekly",
    label: `Week of ${current.monday.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
    from: current.from,
    to: current.to,
    prev: { from: previous.from, to: previous.to, label: "previous week" },
    groupBy: "day",
  };
};

const inRange = (date, range) => Boolean(date) && date >= range.from && date <= range.to;
const dateOf = (value) => (value ? toDateOnly(new Date(value)) : null);

/** Months (YYYY-MM) covered by a range, stopping at today for the current year. */
export const monthsInRange = (range, today = new Date()) => {
  const end = range.to < toDateOnly(today) ? range.to : toDateOnly(today);
  const months = [];
  const cursor = new Date(`${range.from.slice(0, 7)}-01T00:00:00`);
  while (toDateOnly(cursor).slice(0, 7) <= end.slice(0, 7)) {
    months.push(toDateOnly(cursor).slice(0, 7));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
};

export const monthLabel = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${String(y).slice(2)}`;
};

const markPercentage = (mark) => {
  if (mark.subjectPercentage != null) return Number(mark.subjectPercentage) || 0;
  const total = Number(mark.totalMarks) || 0;
  return total > 0 ? (Number(mark.marksObtained) / total) * 100 : null;
};

/**
 * Marks in a range, joined to their test date. `courseTests` is
 * [{ tests, marks }] for the selected courses.
 */
export const marksInRange = (courseTests, range) => {
  const result = [];
  for (const { tests, marks } of courseTests) {
    const testDate = new Map(tests.map((t) => [String(t.id), t.testDate]));
    for (const mark of marks) {
      const date = testDate.get(String(mark.testId));
      if (!inRange(date, range)) continue;
      const pct = markPercentage(mark);
      if (pct != null && Number.isFinite(pct)) result.push({ ...mark, date, pct });
    }
  }
  return result;
};

export const testsInRange = (courseTests, range) =>
  courseTests.flatMap(({ tests }) => tests.filter((t) => inRange(t.testDate, range)));

/**
 * Per-student attendance for a range. A student's % uses only the days their
 * course took attendance, matching the per-course tables.
 */
export const studentAttendance = (students, records, range) => {
  const studentCourse = new Map(students.map((s) => [String(s.id), s.courseCode]));
  const courseDays = new Map();
  const presentDays = new Map();
  for (const record of records) {
    if (!inRange(record.date, range)) continue;
    const id = String(record.studentId);
    const course = studentCourse.get(id);
    if (!course) continue;
    if (!courseDays.has(course)) courseDays.set(course, new Set());
    courseDays.get(course).add(record.date);
    if (record.status === "present") {
      if (!presentDays.has(id)) presentDays.set(id, new Set());
      presentDays.get(id).add(record.date);
    }
  }

  return students.map((student) => {
    const id = String(student.id);
    const days = [...(courseDays.get(student.courseCode) || [])].sort();
    const present = presentDays.get(id) || new Set();
    // Longest run of course days without a "present" mark.
    let streak = 0;
    let longest = 0;
    for (const day of days) {
      streak = present.has(day) ? 0 : streak + 1;
      longest = Math.max(longest, streak);
    }
    return {
      student,
      totalDays: days.length,
      presentDays: present.size,
      percentage: days.length ? Math.round((present.size / days.length) * 100) : null,
      longestAbsence: longest,
    };
  });
};

const studentScores = (marks) => {
  const byStudent = new Map();
  for (const mark of marks) {
    const id = String(mark.studentId);
    if (!byStudent.has(id)) byStudent.set(id, []);
    byStudent.get(id).push(mark.pct);
  }
  return byStudent;
};

const periodStats = (students, records, courseTests, range) => {
  const attendance = studentAttendance(students, records, range);
  const withDays = attendance.filter((a) => a.percentage != null);
  const marks = marksInRange(courseTests, range);
  return {
    attendance,
    marks,
    avgAttendance: withDays.length ? round1(mean(withDays.map((a) => a.percentage))) : null,
    avgScore: marks.length ? round1(mean(marks.map((m) => m.pct))) : null,
    testsHeld: testsInRange(courseTests, range).length,
  };
};

/**
 * Everything for the Summary and Student engagement sections.
 * `students` must have `courseCode` set (normalised course).
 */
export const buildOverview = ({ students, records, courseTests, period }) => {
  const current = periodStats(students, records, courseTests, period);
  const previous = periodStats(students, records, courseTests, period.prev);
  const scoreByStudent = studentScores(current.marks);

  const scored = students
    .map((student) => {
      const values = scoreByStudent.get(String(student.id)) || [];
      return values.length ? { student, score: round1(mean(values)), tests: values.length } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const attendanceById = new Map(current.attendance.map((a) => [String(a.student.id), a]));
  const scoreById = new Map(scored.map((s) => [String(s.student.id), s.score]));

  const atRisk = students
    .map((student) => {
      const att = attendanceById.get(String(student.id));
      const score = scoreById.get(String(student.id));
      const reasons = [];
      if (att?.percentage != null && att.percentage < LOW_ATTENDANCE) reasons.push(`Attendance ${att.percentage}%`);
      if (score != null && score < LOW_SCORE) reasons.push(`Avg score ${score}%`);
      return reasons.length ? { student, reasons, attendance: att?.percentage ?? null, score: score ?? null } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.attendance ?? 101) - (b.attendance ?? 101));

  const bands = { high: 0, mid: 0, low: 0, none: 0 };
  for (const a of current.attendance) {
    if (a.percentage == null) bands.none += 1;
    else if (a.percentage >= 90) bands.high += 1;
    else if (a.percentage >= LOW_ATTENDANCE) bands.mid += 1;
    else bands.low += 1;
  }

  const subjects = new Map();
  for (const mark of current.marks) {
    const key = mark.subject || "—";
    if (!subjects.has(key)) subjects.set(key, []);
    subjects.get(key).push(mark.pct);
  }
  const subjectAverages = [...subjects.entries()]
    .map(([subject, values]) => ({ subject, average: round1(mean(values)), entries: values.length }))
    .sort((a, b) => b.average - a.average);

  const lowAttendance = current.attendance
    .filter((a) => a.percentage != null && a.percentage < LOW_ATTENDANCE)
    .sort((a, b) => a.percentage - b.percentage);

  return {
    summary: {
      students: students.length,
      newAdmissions: students.filter((s) => inRange(dateOf(s.created_at), period)).length,
      avgAttendance: current.avgAttendance,
      avgScore: current.avgScore,
      testsHeld: current.testsHeld,
      atRisk: atRisk.length,
      prevAttendance: previous.avgAttendance,
      prevScore: previous.avgScore,
      prevTestsHeld: previous.testsHeld,
      prevLabel: period.prev.label,
    },
    bands,
    lowAttendance,
    atRisk,
    topStudents: scored.slice(0, 5),
    bottomStudents: scored.length > 5 ? scored.slice(-5).reverse() : [],
    subjectAverages,
    perStudent: students.map((student) => ({
      student,
      attendance: attendanceById.get(String(student.id))?.percentage ?? null,
      score: scoreById.get(String(student.id)) ?? null,
      tests: scored.find((s) => String(s.student.id) === String(student.id))?.tests ?? 0,
    })),
  };
};

/** Month-by-month attendance % and average score % for year reports. */
export const buildMonthlyTrend = ({ students, records, courseTests, period }) =>
  monthsInRange(period).map((ym) => {
    const [y, m] = ym.split("-").map(Number);
    const range = { from: `${ym}-01`, to: toDateOnly(new Date(y, m, 0)) };
    const stats = periodStats(students, records, courseTests, range);
    return {
      label: monthLabel(ym),
      attendance: stats.avgAttendance,
      score: stats.avgScore,
    };
  });

const isMitraUser = (user) => String(user?.role || "").trim().toUpperCase() === "SATHEE MITRA";

/** Sathee Mitra / Vishist work and centre activity for the period. */
export const buildActivity = ({ users, mitraRecords, vishistRecords, leaves, queries, announcements, period, matchesCentre }) => {
  const mentors = users.filter(isMitraUser);
  const mentorIds = new Set(mentors.map((u) => String(u.id)));

  const daysByUser = new Map();
  for (const record of mitraRecords || []) {
    const id = String(record.userId);
    if (!mentorIds.has(id) || !inRange(record.date, period)) continue;
    if (!daysByUser.has(id)) daysByUser.set(id, new Set());
    daysByUser.get(id).add(record.date);
  }

  const sessionsByUser = new Map();
  for (const record of vishistRecords || []) {
    if (!inRange(record.date, period)) continue;
    const id = String(record.vishistUserId);
    if (!sessionsByUser.has(id)) sessionsByUser.set(id, { count: 0, subjects: new Set(), days: new Set() });
    const entry = sessionsByUser.get(id);
    entry.count += 1;
    entry.days.add(record.date);
    if (record.subject) entry.subjects.add(record.subject);
  }

  const mentorRows = mentors
    .map((user) => {
      const id = String(user.id);
      const sessions = sessionsByUser.get(id);
      return {
        name: user.name || user.email || "—",
        type: user.isVishist ? "Vishist" : "Sathee Mitra",
        // Vishists log sessions rather than daily check-ins: count the days they taught.
        daysPresent: user.isVishist ? sessions?.days.size ?? 0 : daysByUser.get(id)?.size ?? 0,
        sessions: sessions?.count ?? 0,
        subjects: sessions ? [...sessions.subjects].sort() : [],
      };
    })
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

  const periodLeaves = (leaves || []).filter(
    (l) => matchesCentre(l.centre) && (inRange(l.fromDate, period) || inRange(dateOf(l.created_at), period))
  );
  const leaveCount = (status) => periodLeaves.filter((l) => String(l.status || "pending").toLowerCase() === status).length;

  const periodQueries = (queries || []).filter((q) => matchesCentre(q.centre) && inRange(dateOf(q.created_at), period));
  const repliedQueries = periodQueries.filter((q) => (q.status || "Open") === "Replied").length;

  const periodAnnouncements = (announcements || [])
    .filter((a) => {
      const forCentre = !a.centre || matchesCentre(a.centre) || (a.otherCentres || []).some((c) => matchesCentre(c));
      return forCentre && inRange(dateOf(a.created_at || a.createdAt), period);
    })
    .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

  return {
    mentorRows,
    vishistSessions: mentorRows.reduce((sum, row) => sum + row.sessions, 0),
    leaves: { total: periodLeaves.length, approved: leaveCount("approved"), rejected: leaveCount("rejected"), pending: leaveCount("pending") },
    queries: { total: periodQueries.length, replied: repliedQueries, open: periodQueries.length - repliedQueries },
    announcements: { total: periodAnnouncements.length, latest: periodAnnouncements.slice(0, 5).map((a) => a.title || "Untitled") },
  };
};
