const assert = require("assert");
const { buildNetworkSummary, indiaDate, platformGroupOf } = require("../src/Utils/networkSummary");

// 26 Nov 2026, 22:00 UTC = 27 Nov 03:30 in India.
const now = new Date("2026-11-26T22:00:00Z");
assert.strictEqual(indiaDate(now), "2026-11-27");
assert.strictEqual(indiaDate(now, 6), "2026-11-21");

assert.strictEqual(platformGroupOf("HCL RAJASTHAN"), "HCL SATHEE");
assert.strictEqual(platformGroupOf("SATHEE BARMER"), "SATHEE Barmer");
assert.strictEqual(platformGroupOf("SATHEE ERODE III"), "SATHEE");

const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
const { today, kendras } = buildNetworkSummary({
  now,
  centres: [{ name: "HCL RAJASTHAN" }, { name: "SATHEE BARMER" }, { name: "SATHEE DEHRADUN" }],
  users: [
    { role: "SATHEE MITRA", centre: "HCL RAJASTHAN" },
    { role: "HCL PARTNER", centre: "HCL Rajasthan" },
    { role: "ADMIN", centre: null },
    { role: "SATHEE MITRA", centre: "SATHEE BARMER" },
  ],
  students: [{ centre: "HCL RAJASTHAN" }, { centre: "HCL SATHEE RAJASTHAN" }, { centre: "SATHEE BARMER" }, { centre: "Nowhere" }],
  attendance: [
    { centre: "HCL RAJASTHAN", status: "present" },
    { centre: "HCL RAJASTHAN", status: "present" },
    { centre: "HCL RAJASTHAN", status: "absent" },
    { centre: "SATHEE BARMER", status: "Present" },
  ],
  mitraDays: [
    // Checked in today, not out yet: counts as checked in, not pending.
    { centre: "HCL RAJASTHAN", date: "2026-11-27", arrival_time: hoursAgo(1), departure_time: null, approved: false },
    // Both photos 3 hours ago, not approved: pending.
    { centre: "SATHEE BARMER", date: "2026-11-26", arrival_time: hoursAgo(12), departure_time: hoursAgo(3), approved: false },
    // Checked out 30 hours ago: too late to approve, so not pending.
    { centre: "SATHEE BARMER", date: "2026-11-25", arrival_time: hoursAgo(40), departure_time: hoursAgo(30), approved: false },
    // Already approved.
    { centre: "SATHEE BARMER", date: "2026-11-26", arrival_time: hoursAgo(12), departure_time: hoursAgo(4), approved: true },
  ],
});

assert.strictEqual(today, "2026-11-27");
const k = Object.fromEntries(kendras.map((r) => [r.name, r]));
assert.deepStrictEqual(
  [k["HCL RAJASTHAN"].kendraId, k["HCL RAJASTHAN"].group, k["HCL RAJASTHAN"].students, k["HCL RAJASTHAN"].satheeMitras, k["HCL RAJASTHAN"].partners],
  ["RJ-JU-01", "HCL SATHEE", 2, 1, 1]
);
assert.strictEqual(k["HCL RAJASTHAN"].attendancePct, 66.7);
assert.strictEqual(k["HCL RAJASTHAN"].mitrasCheckedInToday, 1);
assert.strictEqual(k["HCL RAJASTHAN"].pendingApprovals, 0);
assert.strictEqual(k["SATHEE BARMER"].attendancePct, 100);
assert.strictEqual(k["SATHEE BARMER"].pendingApprovals, 1);
assert.strictEqual(k["SATHEE BARMER"].platform, "SATHEE Barmer");
// No attendance marked yet: shown as "no data", not 0%.
assert.strictEqual(k["SATHEE DEHRADUN"].attendancePct, null);
assert.deepStrictEqual([k["SATHEE DEHRADUN"].kendraId, k["SATHEE DEHRADUN"].group, k["SATHEE DEHRADUN"].platform], ["UK-DN-01", "SATHEE", "SATHEE Dehradun"]);

console.log("network summary tests passed");
