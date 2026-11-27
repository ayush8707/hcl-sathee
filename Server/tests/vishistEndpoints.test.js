const assert = require("assert");
const path = require("path");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-only-secret";

const stub = (rel, exports) => {
  const file = require.resolve(path.join(__dirname, "..", "src", rel));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};

// ---- Stand-ins for the database and email --------------------------------
const users = new Map([
  [1, { id: 1, name: "Asha (MITRA)", email: "asha@x.in", role: "SATHEE MITRA", centre: "HCL RAJASTHAN", password: "h" }],
  [2, { id: 2, name: "Mr. Sharma", email: "sharma@x.in", role: "SATHEE VISHIST", centre: "HCL RAJASTHAN", subject: "Physics", availableDays: ["Friday"], password: null }],
  [3, { id: 3, name: "Ms. Barmer", email: "b@x.in", role: "SATHEE VISHIST", centre: "SATHEE BARMER", availableDays: ["Friday"], password: null }],
]);
const records = [];
const emailed = [];
stub("Models/User", {
  normalizeAvailableDays: (d) => (Array.isArray(d) ? d.filter(Boolean) : []),
  findById: async (id) => users.get(Number(id)) || null,
  findByEmail: async (email) => [...users.values()].find((u) => u.email === email) || null,
  findVishists: async () => [...users.values()].filter((u) => u.role === "SATHEE VISHIST"),
  create: async (u) => {
    const id = users.size + 1;
    users.set(id, { id, ...u });
    return { id, ...u };
  },
});
stub("Models/Centre", { findAll: async () => [{ name: "HCL RAJASTHAN" }, { name: "SATHEE BARMER" }] });
stub("Utils/sendEmail", {
  sendWelcomeEmail: async (email) => emailed.push(email),
  sendPasswordResetOtpEmail: async (email) => emailed.push(`otp:${email}`),
});
stub("Models/VishistAttendance", {
  create: async (r) => {
    if (records.some((x) => x.vishistUserId === r.vishistUserId && x.date === r.date)) {
      const e = new Error("This visit has already been recorded");
      e.status = 409;
      throw e;
    }
    const rec = { ...r, status: r.came ? "pending" : "absent" };
    records.push(rec);
    return rec;
  },
  findForVishists: async () => records,
});

const UserController = require("../src/Controllers/UserController");
const Vishist = require("../src/Controllers/VishistAttendanceController");
const Auth = require("../src/Controllers/AuthController");

const call = (handler, req) =>
  new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, body: payload }); return this; },
    };
    Promise.resolve(handler({ query: {}, params: {}, ...req }, res, reject)).catch(reject);
  });
const admin = { id: 99, role: "ADMIN" };
const mitra = { id: 1, role: "SATHEE MITRA", centre: "HCL RAJASTHAN" };
const today = require("../src/Utils/vishistVisits").indiaDate();

(async () => {
  // Adding a Vishist: needs visit days, sends no invite email.
  let r = await call(UserController.addUser, {
    user: admin,
    body: { name: "New V", email: "newv@x.in", phone: "9876543210", role: "SATHEE VISHIST", centre: "HCL RAJASTHAN", subject: "Maths" },
  });
  assert.strictEqual(r.status, 400);
  assert.match(r.body.message, /day\(s\)/);
  r = await call(UserController.addUser, {
    user: admin,
    body: { name: "New V", email: "newv@x.in", phone: "9876543210", role: "SATHEE VISHIST", centre: "HCL RAJASTHAN", subject: "Maths", availableDays: ["Saturday"] },
  });
  assert.strictEqual(r.status, 201);
  assert.match(r.body.message, /don't log in/);
  assert.strictEqual(r.body.passwordSetupLink, null);
  assert.deepStrictEqual(emailed, []);
  assert.strictEqual(users.get(4).subject, "Maths");
  r = await call(UserController.resendInvite, { user: admin, params: { id: 2 } });
  assert.strictEqual(r.status, 400);

  // Vishists can't log in or reset a password.
  r = await call(Auth.login, { body: { email: "sharma@x.in", password: "anything" } });
  assert.strictEqual(r.status, 403);
  assert.match(r.body.message, /don't log in/);
  r = await call(Auth.requestPasswordResetOtp, { body: { email: "sharma@x.in" } });
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(emailed, []); // generic reply, no code sent

  // Due visits for the SATHEE MITRA's own Kendra only.
  r = await call(Vishist.getDueVisits, { user: mitra, query: { centre: "SATHEE BARMER" } });
  assert.ok(r.body.visits.every((v) => v.name !== "Ms. Barmer"));

  // Marking: own Kendra only, valid dates only, one answer per day.
  r = await call(Vishist.markVishistAttendance, { user: mitra, body: { vishistUserId: "3", date: today } });
  assert.strictEqual(r.status, 403);
  r = await call(Vishist.markVishistAttendance, { user: mitra, body: { vishistUserId: "1", date: today } });
  assert.strictEqual(r.status, 400); // a SATHEE MITRA isn't a Vishist
  r = await call(Vishist.markVishistAttendance, { user: mitra, body: { vishistUserId: "2", date: "2020-01-01" } });
  assert.strictEqual(r.status, 400);
  r = await call(Vishist.markVishistAttendance, { user: mitra, body: { vishistUserId: "2", date: today, topicTaught: "Optics" } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(records[0].subject, "Physics"); // filled from the Vishist
  assert.strictEqual(records[0].topicTaught, "Optics");
  assert.strictEqual(records[0].markedByName, "Asha (MITRA)");
  assert.strictEqual(records[0].came, true);
  r = await call(Vishist.markVishistAttendance, { user: mitra, body: { vishistUserId: "2", date: today, came: "false" } });
  assert.strictEqual(r.status, 409);
  // Didn't come.
  r = await call(Vishist.markVishistAttendance, { user: admin, body: { vishistUserId: "3", date: today, came: "false" } });
  assert.strictEqual(r.status, 200);
  assert.match(r.body.message, /didn't come/);
  assert.strictEqual(records[1].came, false);

  // Approval is admin-only at the route.
  const routes = require("../src/Routes/VishistAttendanceRoutes");
  const approve = routes.stack.find((l) => l.route?.path === "/:id/approve");
  assert.ok(approve.route.stack.some((s) => s.handle.name === "requireAdmin"));

  console.log("vishist endpoint tests passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
