const assert = require("assert");
const { dueVisits, visitDateProblem, weekdayOf, indiaDate } = require("../src/Utils/vishistVisits");
const { isVishistUser, isSatheeVishistRole, isPortalViewerRole, isSatheeMitraRole } = require("../src/Utils/centreMatch");

// Friday 27 Nov 2026, 10:00 in India.
const now = new Date("2026-11-27T04:30:00Z");
assert.strictEqual(indiaDate(now), "2026-11-27");
assert.strictEqual(weekdayOf("2026-11-27"), "Friday");
assert.strictEqual(weekdayOf("2026-11-21"), "Saturday");

assert.strictEqual(visitDateProblem("2026-11-27", now), null);
assert.strictEqual(visitDateProblem("2026-11-21", now), null); // 6 days ago: still allowed
assert.match(visitDateProblem("2026-11-20", now), /last 7 days/);
assert.match(visitDateProblem("2026-11-28", now), /future/);
assert.match(visitDateProblem("27-11-2026", now), /valid/);
assert.match(visitDateProblem("", now), /valid/);

const vishists = [
  { id: 1, name: "Mr. Sharma", subject: "Physics", availableDays: ["Friday"], created_at: "2026-10-01T00:00:00Z" },
  { id: 2, name: "Ms. Rao", subject: null, availableDays: ["Tuesday", "Saturday"], created_at: "2026-10-01T00:00:00Z" },
  // Added on Wednesday: last Saturday's visit is before they joined.
  { id: 3, name: "New", subject: "Maths", availableDays: ["Saturday", "Friday"], created_at: "2026-11-25T06:00:00Z" },
];
const due = dueVisits({ vishists, records: [{ vishistUserId: 2, date: "2026-11-24" }], now });
assert.deepStrictEqual(
  due.map((d) => `${d.name}|${d.date}|${d.weekday}|${d.isToday}`),
  [
    "Mr. Sharma|2026-11-27|Friday|true",
    "New|2026-11-27|Friday|true",
    "Ms. Rao|2026-11-21|Saturday|false",
  ]
);
assert.strictEqual(due[0].subject, "Physics");
// Once answered, it disappears.
assert.strictEqual(
  dueVisits({ vishists, records: [{ vishistUserId: 1, date: "2026-11-27" }], now }).some((d) => d.vishistUserId === 1),
  false
);

// Roles: a SATHEE Vishist is its own role, never a portal user.
assert.strictEqual(isSatheeVishistRole("SATHEE VISHIST"), true);
assert.strictEqual(isSatheeVishistRole("Sathee  Vishist"), true);
assert.strictEqual(isSatheeMitraRole("SATHEE VISHIST"), false);
assert.strictEqual(isPortalViewerRole("SATHEE VISHIST"), false);
assert.strictEqual(isVishistUser({ role: "SATHEE VISHIST" }), true);
// Vishists added before the role existed still count.
assert.strictEqual(isVishistUser({ role: "SATHEE MITRA", isVishist: true }), true);
assert.strictEqual(isVishistUser({ role: "SATHEE MITRA", is_vishist: true }), true);
assert.strictEqual(isVishistUser({ role: "SATHEE MITRA", isVishist: false }), false);

console.log("vishist visit tests passed");
