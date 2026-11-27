const VALID_CENTRES = [
  "HCL RAJASTHAN",
  "HCL RAJATHAN",
  "HCL JHARKHAND",
  "HCL MADHYA PRADESH",
  "SATHEE BARMER",
];

// Records without a centre (e.g. admin accounts) arrive as null.
const normalizeCentreValue = (value = "") =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

const getCanonicalCentreKey = (value = "") => {
  const normalized = normalizeCentreValue(value);

  // Barmer is in Rajasthan too, so check it before the state-wide rule.
  if (normalized.includes("BARMER")) return "SATHEEBARMER";
  // Kendras added on the SATHEE page are named "SATHEE <place>" and are each
  // their own Kendra, even when the place names a state (e.g. Rajasthan).
  if (normalized.startsWith("SATHEE")) return normalized;
  if (normalized.includes("RAJASTHAN") || normalized.includes("RAJATHAN")) {
    return "HCLRAJASTHAN";
  }
  if (normalized.includes("JHARKHAND")) return "HCLJHARKHAND";
  if (normalized.includes("MADHYAPRADESH")) return "HCLMADHYAPRADESH";

  return normalized;
};

/**
 * Dynamic centre validation. Checks the given name against the live centre list
 * (the 3 defaults plus any admin-added centres in Firestore) using the same
 * fuzzy canonical-key matching as everywhere else.
 *
 * Required lazily to avoid a require cycle with Models/Centre.
 */
const isValidCentre = async (name) => {
  const centres = await require("../Models/Centre").findAll();
  const key = getCanonicalCentreKey(name);
  return centres.some((c) => getCanonicalCentreKey(c.name) === key);
};

const matchesCentre = (itemCentre, userCentre) => {
  if (!userCentre) return false;
  return getCanonicalCentreKey(itemCentre) === getCanonicalCentreKey(userCentre);
};

const normalizeRole = (role = "") =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const isAdminRole = (role = "") => normalizeRole(role) === "ADMIN";

const isHclPartnerRole = (role = "") => normalizeRole(role) === "HCL PARTNER";

const isSatheeMitraRole = (role = "") => {
  const normalized = normalizeRole(role);
  return (
    normalized === "SATHEE MITRA" ||
    normalized.replace(/\s/g, "") === "SATHEEMITRA"
  );
};

// A visiting mentor who comes about once a week. Has no login: the Kendra's
// SATHEE MITRA records their visits.
const isSatheeVishistRole = (role = "") => normalizeRole(role).replace(/\s/g, "") === "SATHEEVISHIST";

// A SATHEE Vishist, including ones added before SATHEE VISHIST was its own role
// (a SATHEE MITRA with is_vishist set).
const isVishistUser = (user = {}) =>
  isSatheeVishistRole(user.role) ||
  (isSatheeMitraRole(user.role) &&
    [true, "true", 1, "1"].includes(user.isVishist ?? user.is_vishist));

// Kendras that are their own platform (not HCL SATHEE): SATHEE Barmer and every
// Kendra added on the SATHEE page ("SATHEE <place>"). Mirrors isStandalonePortal
// in Client/src/utils/portalMapping.js.
const STANDALONE_PLATFORM_NAMES = { SATHEEBARMER: "SATHEE Barmer" };
const isStandaloneCentre = (centre = "") =>
  getCanonicalCentreKey(centre ?? "").startsWith("SATHEE");

// "SATHEE KOTA" -> "SATHEE Kota"; listed Kendras use their own label
// ("SATHEE ERODE III" -> "SATHEE Erode 3"). Required lazily: that list's
// module loads after this one.
const satheeKendraName = (centre = "") =>
  ((label) => (label ? `SATHEE ${label}` : null))(
    require("./satheeKendras").SATHEE_KENDRAS.find(
      (k) => getCanonicalCentreKey(k.name) === getCanonicalCentreKey(centre)
    )?.label
  ) ||
  "SATHEE " +
  String(centre ?? "")
    .trim()
    .replace(/^SATHEE\s*/i, "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());

/**
 * True when an item's centre belongs to the same platform as `centre`:
 * a standalone Kendra only matches itself; every other centre (including
 * records with no centre) belongs to HCL SATHEE.
 */
const samePlatformAs = (itemCentre, centre) =>
  isStandaloneCentre(centre)
    ? matchesCentre(itemCentre, centre)
    : !isStandaloneCentre(itemCentre);

const platformNameForCentre = (centre = "") =>
  STANDALONE_PLATFORM_NAMES[getCanonicalCentreKey(centre ?? "")] ||
  (isStandaloneCentre(centre) ? satheeKendraName(centre) : "HCL SATHEE");

/**
 * The partner role is stored as "HCL PARTNER" everywhere. Standalone Kendras
 * are funded by other CSR partners, so text shown to their users says
 * "CSR PARTNER". Display only — never use this for permission checks.
 */
const displayRoleForCentre = (role = "", centre = "") =>
  isHclPartnerRole(role) && isStandaloneCentre(centre)
    ? "CSR PARTNER"
    : role;

const isPortalViewerRole = (role = "") =>
  isAdminRole(role) || isHclPartnerRole(role) || isSatheeMitraRole(role);

const filterByUserCentre = (items, user, centreField = "centre") => {
  if (!user || isAdminRole(user.role)) return items;
  if (!isHclPartnerRole(user.role) && !isSatheeMitraRole(user.role)) return [];
  return items.filter((item) => matchesCentre(item?.[centreField], user.centre));
};

module.exports = {
  VALID_CENTRES,
  isValidCentre,
  normalizeCentreValue,
  getCanonicalCentreKey,
  matchesCentre,
  normalizeRole,
  isAdminRole,
  isHclPartnerRole,
  isSatheeMitraRole,
  isSatheeVishistRole,
  isVishistUser,
  isPortalViewerRole,
  filterByUserCentre,
  displayRoleForCentre,
  platformNameForCentre,
  isStandaloneCentre,
  samePlatformAs,
};
