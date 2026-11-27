const {
  getCanonicalCentreKey,
  isStandaloneCentre,
  isSatheeMitraRole,
  isHclPartnerRole,
  platformNameForCentre,
} = require("./centreMatch");
const { getCentreId } = require("./centreDirectory");

/** Days of student attendance the summary covers, ending today. */
const ATTENDANCE_DAYS = 7;
/** A SATHEE MITRA day can be approved for this long after check-out. */
const APPROVAL_WINDOW_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** "YYYY-MM-DD" in India time, `daysAgo` days before `now`. */
const indiaDate = (now = new Date(), daysAgo = 0) =>
  new Date(now.getTime() + IST_OFFSET_MS - daysAgo * 86400000).toISOString().slice(0, 10);

/** Which card on the platform screen a centre is under. */
const platformGroupOf = (centre) => {
  if (!isStandaloneCentre(centre)) return "HCL SATHEE";
  return getCanonicalCentreKey(centre) === "SATHEEBARMER" ? "SATHEE Barmer" : "SATHEE";
};

/**
 * One row per Kendra for the admin "Network summary".
 *  centres     Centre.findAll()
 *  users       [{ role, centre }]
 *  students    [{ centre }]
 *  attendance  [{ centre, status }] student marks from the last ATTENDANCE_DAYS days
 *  mitraDays   [{ centre, date, arrival_time, departure_time, approved }] recent days
 */
const buildNetworkSummary = ({ centres, users, students, attendance, mitraDays, now = new Date() }) => {
  const today = indiaDate(now);
  const byKey = new Map(
    centres.map((c) => [
      getCanonicalCentreKey(c.name),
      {
        name: c.name,
        kendraId: getCentreId(c.name),
        platform: platformNameForCentre(c.name),
        group: platformGroupOf(c.name),
        students: 0,
        satheeMitras: 0,
        partners: 0,
        marks: 0,
        present: 0,
        mitrasCheckedInToday: 0,
        pendingApprovals: 0,
      },
    ])
  );
  const rowFor = (centre) => byKey.get(getCanonicalCentreKey(centre));

  for (const u of users) {
    const row = rowFor(u.centre);
    if (!row) continue;
    if (isSatheeMitraRole(u.role)) row.satheeMitras += 1;
    else if (isHclPartnerRole(u.role)) row.partners += 1;
  }
  for (const s of students) {
    const row = rowFor(s.centre);
    if (row) row.students += 1;
  }
  for (const a of attendance) {
    const row = rowFor(a.centre);
    if (!row) continue;
    row.marks += 1;
    if (String(a.status).toLowerCase() === "present") row.present += 1;
  }
  for (const m of mitraDays) {
    const row = rowFor(m.centre);
    if (!row) continue;
    if (m.date === today && m.arrival_time) row.mitrasCheckedInToday += 1;
    const left = m.departure_time ? APPROVAL_WINDOW_MS - (now - new Date(m.departure_time)) : 0;
    if (m.departure_time && !m.approved && left > 0) row.pendingApprovals += 1;
  }

  const kendras = [...byKey.values()].map(({ marks, present, ...row }) => ({
    ...row,
    attendanceMarks: marks,
    attendancePct: marks ? Math.round((present / marks) * 1000) / 10 : null,
  }));
  return { today, attendanceDays: ATTENDANCE_DAYS, kendras };
};

module.exports = { ATTENDANCE_DAYS, indiaDate, platformGroupOf, buildNetworkSummary };
