const assert = require("assert");
const path = require("path");

const stub = (rel, exports) => {
  const file = require.resolve(path.join(__dirname, "..", "src", rel));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};

const students = {
  1: { id: 1, name: "Ssc", course: "SSC", centre: "HCL RAJASTHAN", subjects: ["Quantitative Aptitude", "Reasoning Ability", "English Language", "General Awareness"] },
  2: { id: 2, name: "Ibps", course: "IBPS", centre: "HCL RAJASTHAN", subjects: ["Quantitative Aptitude", "Reasoning Ability", "English Language", "General Awareness", "Computer Knowledge"] },
  3: { id: 3, name: "Rrb", course: "RRB", centre: "HCL RAJASTHAN", subjects: ["Mathematics", "General Intelligence & Reasoning", "General Science", "General Awareness", "Current Affairs"] },
};
const upserts = [];
const recomputed = [];
stub("Models/Student", { findByIds: async (ids) => ids.map((id) => students[id]).filter(Boolean) });
stub("Models/DailySubjectAttendance", { upsert: async (r) => (upserts.push(r), r) });
stub("Utils/recomputeSubjectAttendance", { recomputeSubjectAttendance: async (id, subject) => (recomputed.push(`${id}:${subject}`), {}) });

const { saveDailySubjectAttendance } = require("../src/Controllers/StudentPerformanceController");
const call = (req) =>
  new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(b) { resolve({ status: this.statusCode, body: b }); return this; },
    };
    Promise.resolve(saveDailySubjectAttendance(req, res, reject)).catch(reject);
  });

(async () => {
  const { body } = await call({
    user: { role: "SATHEE MITRA", centre: "HCL RAJASTHAN" },
    body: {
      date: "2026-11-28",
      subject: "Quantitative Aptitude",
      time: "09:00–10:00",
      course: "SSC",
      records: [
        { studentId: 1, status: "present" },
        { studentId: 2, status: "absent" },
        // RRB student in the SSC class, saved under their own subject.
        { studentId: 3, status: "present", subject: "Mathematics" },
      ],
    },
  });
  assert.strictEqual(body.savedCount, 3);
  assert.deepStrictEqual(body.errors, []);
  assert.deepStrictEqual(
    upserts.map((u) => `${u.studentId}|${u.subject}|${u.course}|${u.status}`),
    ["1|Quantitative Aptitude|SSC|present", "2|Quantitative Aptitude|IBPS|absent", "3|Mathematics|RRB|present"]
  );
  assert.deepStrictEqual(recomputed, ["1:Quantitative Aptitude", "2:Quantitative Aptitude", "3:Mathematics"]);

  // A subject the student doesn't study is still refused.
  upserts.length = 0;
  const bad = await call({
    user: { role: "SATHEE MITRA", centre: "HCL RAJASTHAN" },
    body: { date: "2026-11-28", subject: "English Language", course: "SSC", records: [{ studentId: 3, status: "present" }] },
  });
  assert.strictEqual(bad.body.savedCount, 0);
  assert.match(bad.body.errors[0].message, /not enrolled in subject English Language/);

  // Without a row subject nothing changes: same-course class as before.
  upserts.length = 0;
  await call({
    user: { role: "ADMIN" },
    body: { date: "2026-11-28", subject: "Reasoning Ability", course: "SSC", records: [{ studentId: 1, status: "present" }] },
  });
  assert.strictEqual(upserts[0].subject, "Reasoning Ability");
  assert.strictEqual(upserts[0].course, "SSC");

  console.log("combined batch attendance tests passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
