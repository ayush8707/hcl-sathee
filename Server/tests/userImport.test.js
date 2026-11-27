const assert = require("assert");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-only-secret";
const path = require("path");

// ---- Pure helpers --------------------------------------------------------
const { normalizeImportRole, resolveImportCentre } = require("../src/Utils/userImport");

assert.strictEqual(normalizeImportRole("Sathee Mitra"), "SATHEE MITRA");
assert.strictEqual(normalizeImportRole("sathee_mitra"), "SATHEE MITRA");
assert.strictEqual(normalizeImportRole("mentor"), "SATHEE MITRA");
assert.strictEqual(normalizeImportRole("CSR Partner"), "HCL PARTNER");
assert.strictEqual(normalizeImportRole("hcl partner"), "HCL PARTNER");
assert.strictEqual(normalizeImportRole("Partner"), "HCL PARTNER");
assert.strictEqual(normalizeImportRole("ADMIN"), null); // never from a sheet
assert.strictEqual(normalizeImportRole(""), null);

const centres = [
  { name: "HCL RAJASTHAN" },
  { name: "SATHEE BARMER" },
  { name: "SATHEE DEHRADUN" },
  { name: "SATHEE ERODE III" },
];
assert.strictEqual(resolveImportCentre("UK-DN-01", centres), "SATHEE DEHRADUN");
assert.strictEqual(resolveImportCentre("uk-dn-01", centres), "SATHEE DEHRADUN");
assert.strictEqual(resolveImportCentre("TN-EE-03", centres), "SATHEE ERODE III");
assert.strictEqual(resolveImportCentre("RJ-JU-01", centres), "HCL RAJASTHAN");
assert.strictEqual(resolveImportCentre("Sathee Dehradun", centres), "SATHEE DEHRADUN");
assert.strictEqual(resolveImportCentre("HCL SATHEE RAJASTHAN", centres), "HCL RAJASTHAN");
assert.strictEqual(resolveImportCentre("", centres, "SATHEE BARMER"), "SATHEE BARMER");
assert.strictEqual(resolveImportCentre("XX-YY-01", centres), null);
assert.strictEqual(resolveImportCentre("Nowhere", centres), null);
assert.strictEqual(resolveImportCentre("", centres, ""), null);

// ---- The endpoint, with the database and email replaced ------------------
const stub = (rel, exports) => {
  const file = require.resolve(path.join(__dirname, "..", "src", rel));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
const created = [];
const emailed = [];
stub("Models/User", {
  normalizeAvailableDays: (d) => (Array.isArray(d) ? d : []),
  create: async (u) => {
    if (u.email === "taken@sathee.in") {
      const e = new Error("A user with this email already exists");
      e.code = "DUPLICATE_EMAIL";
      throw e;
    }
    created.push(u);
    return { id: created.length, ...u };
  },
});
stub("Models/Centre", { findAll: async () => centres });
stub("Utils/sendEmail", {
  sendWelcomeEmail: async (email, name, role, centre) => {
    if (email === "bounce@sathee.in") throw new Error("Mailbox unavailable");
    emailed.push({ email, role, centre });
  },
});
const { importUsers } = require("../src/Controllers/UserController");

const call = (body) =>
  new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, body: payload }); return this; },
    };
    Promise.resolve(importUsers({ body, user: { role: "ADMIN" } }, res, reject)).catch(reject);
  });

(async () => {
  const { status, body } = await call({
    defaultCentre: "SATHEE DEHRADUN",
    users: [
      { __row: 2, name: "Asha", email: "Asha@Sathee.in", phone: "98765 43210", role: "Sathee Mitra", kendra: "UK-DN-01" },
      { __row: 3, name: "Ravi", email: "ravi@sathee.in", phone: "9876543211", role: "CSR Partner", kendra: "" },
      { __row: 4, name: "Meena", email: "meena@sathee.in", phone: "9876543212", role: "Mitra", kendra: "TN-EE-03" },
      { __row: 5, name: "Dup", email: "asha@sathee.in", phone: "9876543299", role: "Mitra", kendra: "UK-DN-01" },
      { __row: 6, name: "Boss", email: "boss@sathee.in", phone: "9876543213", role: "Admin", kendra: "UK-DN-01" },
      { __row: 7, name: "Lost", email: "lost@sathee.in", phone: "9876543214", role: "Mitra", kendra: "ZZ-ZZ-01" },
      { __row: 8, name: "Short", email: "short@sathee.in", phone: "12345", role: "Mitra", kendra: "UK-DN-01" },
      { __row: 9, name: "Taken", email: "taken@sathee.in", phone: "9876543215", role: "Mitra", kendra: "UK-DN-01" },
      { __row: 10, name: "Bounce", email: "bounce@sathee.in", phone: "9876543216", role: "Partner", kendra: "Sathee Barmer" },
    ],
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(body.total, 9);
  assert.strictEqual(body.created, 4);
  assert.strictEqual(body.failed, 5);
  assert.strictEqual(body.emailsSent, 3);

  const byRow = Object.fromEntries(body.results.map((r) => [r.row, r]));
  assert.deepStrictEqual([byRow[2].ok, byRow[2].centre, byRow[2].role], [true, "SATHEE DEHRADUN", "SATHEE MITRA"]);
  assert.deepStrictEqual([byRow[3].ok, byRow[3].centre, byRow[3].role], [true, "SATHEE DEHRADUN", "HCL PARTNER"]);
  assert.strictEqual(byRow[4].centre, "SATHEE ERODE III");
  assert.match(byRow[5].message, /earlier in the sheet/);
  assert.match(byRow[6].message, /SATHEE MITRA or Partner/);
  assert.match(byRow[7].message, /Unknown Kendra "ZZ-ZZ-01"/);
  assert.match(byRow[8].message, /10 digits/);
  assert.match(byRow[9].message, /already exists/);
  // Added, but the email failed: the admin gets the set-password link instead.
  assert.strictEqual(byRow[10].ok, true);
  assert.strictEqual(byRow[10].emailSent, false);
  assert.ok(byRow[10].passwordSetupLink);

  assert.strictEqual(created[0].email, "asha@sathee.in");
  assert.strictEqual(created[0].phone, "9876543210");
  assert.ok(created.every((u) => u.password === null));
  assert.ok(!created.some((u) => u.role === "ADMIN"));

  const tooMany = await call({ users: Array.from({ length: 201 }, () => ({})) });
  assert.strictEqual(tooMany.status, 400);
  const none = await call({ users: [] });
  assert.strictEqual(none.status, 400);

  console.log("user import tests passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
