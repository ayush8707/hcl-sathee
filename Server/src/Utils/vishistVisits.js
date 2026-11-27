/**
 * SATHEE Vishist visits. A Vishist comes on set weekdays (usually once a
 * week); on those days the Kendra's SATHEE MITRA answers "Did they come?".
 * A visit can be recorded up to MARK_WINDOW_DAYS days late, never early.
 */
const MARK_WINDOW_DAYS = 7;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" in India time, `daysAgo` days before `now`. */
const indiaDate = (now = new Date(), daysAgo = 0) =>
  new Date(now.getTime() + IST_OFFSET_MS - daysAgo * 86400000).toISOString().slice(0, 10);

const weekdayOf = (date) => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

/** Null when `date` can be recorded now, otherwise the reason it can't. */
const visitDateProblem = (date, now = new Date()) => {
  if (!DATE_RE.test(String(date || "")) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())) {
    return "Choose a valid visit date";
  }
  if (date > indiaDate(now)) return "A visit can't be recorded for a future date";
  if (date < indiaDate(now, MARK_WINDOW_DAYS - 1)) {
    return `Visits can only be recorded for the last ${MARK_WINDOW_DAYS} days`;
  }
  return null;
};

/**
 * Visits still waiting for an answer, newest first: every visit day of every
 * Vishist in the last MARK_WINDOW_DAYS days that has no record yet. Days
 * before the Vishist was added are skipped.
 *  vishists  [{ id, name, subject, availableDays, created_at }]
 *  records   [{ vishistUserId, date }] already recorded in that window
 */
const dueVisits = ({ vishists, records, now = new Date() }) => {
  const done = new Set(records.map((r) => `${r.vishistUserId}|${r.date}`));
  const due = [];
  for (let back = 0; back < MARK_WINDOW_DAYS; back += 1) {
    const date = indiaDate(now, back);
    const weekday = weekdayOf(date);
    for (const v of vishists) {
      const days = (v.availableDays || []).map((d) => String(d).toLowerCase());
      if (!days.includes(weekday.toLowerCase())) continue;
      if (v.created_at && date < indiaDate(new Date(v.created_at))) continue;
      if (done.has(`${v.id}|${date}`)) continue;
      due.push({
        vishistUserId: v.id,
        name: v.name,
        subject: v.subject || null,
        date,
        weekday,
        isToday: back === 0,
      });
    }
  }
  return due;
};

module.exports = { MARK_WINDOW_DAYS, indiaDate, weekdayOf, visitDateProblem, dueVisits };
