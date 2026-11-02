const assert = require('assert');
const {
  resolvePercentage,
  resolveAttendancePercentages,
} = require('../src/Models/MitraAttendance');

const cases = [
  [75, 75],
  [null, 100],
  ['150', 100],
  ['88', 88],
];

for (const [provided, expected] of cases) {
  const actual = resolvePercentage(provided, 100);
  assert.strictEqual(actual, expected, `expected ${expected} for ${provided}`);
}

const percentages = resolveAttendancePercentages(
  {
    dailyAttendancePercentage: 82,
  },
  {
    dailyAttendancePercentage: 100,
    weeklyAttendancePercentage: 90,
    monthlyAttendancePercentage: 85,
  }
);

assert.strictEqual(percentages.dailyAttendancePercentage, 82);
assert.strictEqual(percentages.weeklyAttendancePercentage, 90);
assert.strictEqual(percentages.monthlyAttendancePercentage, 85);

console.log('mitra attendance percentage tests passed');

// --- check-in location (geofence) ------------------------------------------
const { distanceMetres, checkGeofence, parsePosition, KENDRA_LOCATIONS } = require('../src/Utils/kendraLocations');
// Jaipur -> Jodhpur is roughly 290 km.
const km = distanceMetres({ lat: 26.9124, lng: 75.7873 }, { lat: 26.2389, lng: 73.0243 }) / 1000;
assert.ok(km > 280 && km < 300, `distance ${km} km`);

assert.deepStrictEqual(parsePosition({ latitude: '26.9', longitude: '75.8', accuracy: '18.6' }), { lat: 26.9, lng: 75.8, accuracy: 19 });
assert.strictEqual(parsePosition({}), null);
assert.strictEqual(parsePosition({ latitude: 'abc', longitude: '1' }), null);
assert.strictEqual(parsePosition({ latitude: '95', longitude: '1' }), null);

// No Kendra location configured: always allowed.
assert.strictEqual(checkGeofence('NOWHERE KENDRA', null).allowed, true);

// With a configured Kendra: near is allowed, far or missing location is not.
KENDRA_LOCATIONS.TESTKENDRA = { lat: 25.0, lng: 71.0, radiusM: 200 };
const near = checkGeofence('TEST KENDRA', { lat: 25.001, lng: 71.0, accuracy: 10 }); // ~111 m
assert.strictEqual(near.allowed, true);
const edge = checkGeofence('TEST KENDRA', { lat: 25.002, lng: 71.0, accuracy: 30 }); // ~222 m, minus 30 m GPS slack
assert.strictEqual(edge.allowed, true);
assert.strictEqual(checkGeofence('TEST KENDRA', { lat: 25.0025, lng: 71.0, accuracy: 30 }).allowed, false); // ~278 m
const far = checkGeofence('TEST KENDRA', { lat: 25.01, lng: 71.0, accuracy: 500 }); // ~1.1 km, slack capped at 50 m
assert.strictEqual(far.allowed, false);
assert.strictEqual(far.reason, 'too-far');
assert.strictEqual(checkGeofence('TEST KENDRA', null).reason, 'no-location');
delete KENDRA_LOCATIONS.TESTKENDRA;

console.log('mitra check-in location tests passed');
