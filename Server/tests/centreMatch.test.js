const assert = require("assert");
const c = require("../src/Utils/centreMatch");

// Kendras added on the SATHEE page ("SATHEE <place>") are their own platform,
// even when the place names a state that has an HCL portal.
assert.strictEqual(c.getCanonicalCentreKey("SATHEE Jaipur Rajasthan"), "SATHEEJAIPURRAJASTHAN");
assert.strictEqual(c.isStandaloneCentre("SATHEE KOTA"), true);
assert.strictEqual(c.platformNameForCentre("SATHEE KOTA"), "SATHEE Kota");
assert.strictEqual(c.displayRoleForCentre("HCL PARTNER", "SATHEE KOTA"), "CSR PARTNER");
assert.strictEqual(c.samePlatformAs("SATHEE KOTA", "HCL RAJASTHAN"), false);
assert.strictEqual(c.samePlatformAs("SATHEE KOTA", "SATHEE BARMER"), false);
assert.strictEqual(c.samePlatformAs("SATHEE KOTA", "SATHEE Kota"), true);

// Barmer and HCL centres are unchanged.
assert.strictEqual(c.getCanonicalCentreKey("SATHEE BARMER"), "SATHEEBARMER");
assert.strictEqual(c.platformNameForCentre("SATHEE BARMER"), "SATHEE Barmer");
assert.strictEqual(c.getCanonicalCentreKey("HCL SATHEE RAJASTHAN"), "HCLRAJASTHAN");
assert.strictEqual(c.isStandaloneCentre("HCL UTTAR PRADESH"), false);
assert.strictEqual(c.displayRoleForCentre("HCL PARTNER", "HCL JHARKHAND"), "HCL PARTNER");
assert.strictEqual(c.isStandaloneCentre(null), false);

console.log("centre match tests passed");
