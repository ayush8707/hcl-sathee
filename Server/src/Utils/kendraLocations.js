const { getCanonicalCentreKey } = require("./centreMatch");

/**
 * GPS position of each Kendra, keyed by canonical centre key. When a Kendra is
 * listed here, SATHEE MITRA check-in/out only works within `radiusM` metres
 * of it; Kendras not listed accept any location (it is still recorded).
 *
 * To add one: open the Kendra in Google Maps, long-press the spot, copy the
 * two numbers shown (latitude, longitude), e.g.
 *   HCLRAJASTHAN: { lat: 28.0229, lng: 75.789, radiusM: 200 },
 */
const KENDRA_LOCATIONS = {
  // HCLRAJASTHAN: { lat: 0, lng: 0, radiusM: 200 },
  // HCLJHARKHAND: { lat: 0, lng: 0, radiusM: 200 },
  // HCLMADHYAPRADESH: { lat: 0, lng: 0, radiusM: 200 },
  // SATHEEBARMER: { lat: 0, lng: 0, radiusM: 200 },
};

// Phone GPS is often off by tens of metres indoors; give that much benefit of
// the doubt, but never more than this.
const MAX_ACCURACY_ALLOWANCE_M = 50;

const toRad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance in metres between two lat/lng points. */
const distanceMetres = (a, b) => {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const getKendraLocation = (centre) => KENDRA_LOCATIONS[getCanonicalCentreKey(centre ?? "")] || null;

/**
 * Checks a check-in position against the Kendra's location.
 * Returns { configured, allowed, distanceM, radiusM, reason }.
 */
const checkGeofence = (centre, position) => {
  const kendra = getKendraLocation(centre);
  if (!kendra) return { configured: false, allowed: true, distanceM: null, radiusM: null };

  const radiusM = kendra.radiusM || 200;
  if (!position) {
    return { configured: true, allowed: false, distanceM: null, radiusM, reason: "no-location" };
  }
  const distanceM = Math.round(distanceMetres(kendra, position));
  const allowance = Math.min(Math.max(Number(position.accuracy) || 0, 0), MAX_ACCURACY_ALLOWANCE_M);
  const allowed = distanceM - allowance <= radiusM;
  return { configured: true, allowed, distanceM, radiusM, reason: allowed ? null : "too-far" };
};

/** Parses lat/lng/accuracy from a request body; null when missing or invalid. */
const parsePosition = (body = {}) => {
  const lat = Number(body.latitude);
  const lng = Number(body.longitude);
  if (body.latitude == null || body.longitude == null || body.latitude === "" || body.longitude === "") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const accuracy = Number(body.accuracy);
  return { lat, lng, accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? Math.round(accuracy) : null };
};

module.exports = { KENDRA_LOCATIONS, distanceMetres, checkGeofence, parsePosition, getKendraLocation };
