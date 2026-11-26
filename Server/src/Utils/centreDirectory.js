const { getCanonicalCentreKey } = require("./centreMatch");
const { SATHEE_KENDRAS } = require("./satheeKendras");

/**
 * Hardcoded per-centre Kendra IDs for the 3 default centres — mirrors
 * Client/src/utils/centreDirectory.js. Used server-side to prefix
 * auto-generated student IDs with the student's centre's Kendra ID.
 * Custom centres (beyond the 3 defaults) have no Kendra ID yet.
 */
const CENTRE_DIRECTORY_BY_KEY = {
  HCLRAJASTHAN: "RJ-JU-01",
  HCLJHARKHAND: "JH-EM-01",
  HCLMADHYAPRADESH: "MP-BT-01",
  SATHEEBARMER: "RJ-BA-01",
  ...Object.fromEntries(SATHEE_KENDRAS.map((k) => [getCanonicalCentreKey(k.name), k.id])),
};

const shortPrefix = (kendraId) => kendraId.replace(/-\d+$/, "");
const prefixCounts = Object.values(CENTRE_DIRECTORY_BY_KEY).reduce((counts, id) => {
  counts[shortPrefix(id)] = (counts[shortPrefix(id)] || 0) + 1;
  return counts;
}, {});

/** Accepts a centre name or a portal title (e.g. "HCL SATHEE RAJASTHAN"). */
const getCentreId = (centreNameOrPortalName = "") => {
  const key = getCanonicalCentreKey(centreNameOrPortalName);
  return CENTRE_DIRECTORY_BY_KEY[key] ?? null;
};

/**
 * Strips the trailing "-NN" location-sequence segment off a Kendra ID, e.g.
 * "RJ-JU-01" -> "RJ-JU". Used as the prefix for sequential student IDs
 * (RJ-JU-001, RJ-JU-002, ...), which count students, not Kendra locations.
 */
const getStudentIdPrefix = (centreNameOrPortalName = "") => {
  const kendraId = getCentreId(centreNameOrPortalName);
  if (!kendraId) return null;
  // Several Kendras in one district (e.g. the five Erode Kendras, TN-EE-01 to
  // TN-EE-05) would share "TN-EE" and give out the same student IDs, so they
  // keep the full Kendra ID: TN-EE-02-001.
  return prefixCounts[shortPrefix(kendraId)] > 1 ? kendraId : shortPrefix(kendraId);
};

module.exports = { getCentreId, getStudentIdPrefix };
