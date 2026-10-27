const assert = require("assert");
const { buildSupportQueryNotificationPayload } = require("../src/Utils/supportQueries");

const payload = buildSupportQueryNotificationPayload({
  title: "Portal access issue",
  description: "Unable to view the dashboard",
  user: { id: 12, name: "Mina", email: "mina@example.com" },
});

assert.strictEqual(payload.title, "New Query from Partner Portal");
assert.match(payload.body, /Mina/);
assert.match(payload.body, /Portal access issue/);
assert.strictEqual(payload.data.type, "support-query");
assert.strictEqual(payload.data.queryTitle, "Portal access issue");

// --- queries are split by platform: SATHEE Barmer vs HCL SATHEE -----------
const { samePlatformAs } = require("../src/Utils/centreMatch");
const queries = [
  { id: 1, centre: "HCL RAJASTHAN" },
  { id: 2, centre: "HCL JHARKHAND" },
  { id: 3, centre: "SATHEE BARMER" },
  { id: 4, centre: null },
];
const ids = (centre) => queries.filter((q) => samePlatformAs(q.centre, centre)).map((q) => q.id);
assert.deepStrictEqual(ids("SATHEE BARMER"), [3], "Barmer portal sees only Barmer queries");
assert.deepStrictEqual(ids("HCL RAJASTHAN"), [1, 2, 4], "HCL portals see every HCL query, never Barmer's");
assert.deepStrictEqual(ids("HCL MADHYA PRADESH"), [1, 2, 4]);

const barmerPayload = buildSupportQueryNotificationPayload({
  title: "Lab equipment",
  description: "Projector not working",
  user: { name: "Rakesh", email: "rakesh@example.com", centre: "SATHEE BARMER" },
});
assert.strictEqual(barmerPayload.title, "New Query from SATHEE Barmer");

const { renderSupportQueryEmail, renderSupportQueryReplyEmail } = require("../src/Utils/sendEmail");
const hclMail = renderSupportQueryEmail({ partnerName: "Asha", title: "T", description: "D" });
assert.strictEqual(hclMail.subject, "New partner query submitted", "HCL query email unchanged");
const barmerMail = renderSupportQueryEmail({ partnerName: "Rakesh", title: "T", description: "D", platform: "SATHEE Barmer" });
assert.strictEqual(barmerMail.subject, "New query from SATHEE Barmer");
assert.ok(barmerMail.text.includes("Rakesh (SATHEE Barmer)") && !/HCL/.test(barmerMail.html));
const barmerReply = renderSupportQueryReplyEmail({ adminName: "Admin", title: "T", message: "M", platform: "SATHEE Barmer" });
assert.ok(!/HCL/.test(barmerReply.html), "Barmer reply email never mentions HCL");

console.log("support query notification tests passed");
