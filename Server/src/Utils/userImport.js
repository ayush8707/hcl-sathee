const { getCanonicalCentreKey } = require("./centreMatch");
const { getCentreId } = require("./centreDirectory");

/** Most rows one "Import users" upload may contain. */
const MAX_USER_IMPORT_ROWS = 200;

const KENDRA_ID_RE = /^[A-Z]{2}-[A-Z]{2}-\d{2}$/i;

const ROLE_ALIASES = {
  "SATHEE MITRA": "SATHEE MITRA",
  SATHEEMITRA: "SATHEE MITRA",
  MITRA: "SATHEE MITRA",
  MENTOR: "SATHEE MITRA",
  TEACHER: "SATHEE MITRA",
  "HCL PARTNER": "HCL PARTNER",
  "CSR PARTNER": "HCL PARTNER",
  PARTNER: "HCL PARTNER",
};

/**
 * Maps the Role cell of an import sheet to a stored role. Admins can't be
 * added from a sheet. "CSR PARTNER" is stored as "HCL PARTNER" (the stored
 * name for every partner; standalone Kendras only display it as CSR PARTNER).
 * Returns null when the cell isn't a role we accept.
 */
const normalizeImportRole = (value = "") => {
  const cleaned = String(value ?? "")
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ROLE_ALIASES[cleaned] || ROLE_ALIASES[cleaned.replace(/\s/g, "")] || null;
};

/**
 * Finds the centre an import row belongs to. The Kendra cell may hold a
 * Kendra ID (UK-DN-01) or a centre name in any spelling the app already
 * understands ("SATHEE Dehradun", "HCL SATHEE RAJASTHAN"); a blank cell uses
 * `fallback` (the portal the admin is importing from). `centres` is the list
 * from Centre.findAll(). Returns the stored centre name, or null.
 */
const resolveImportCentre = (value, centres = [], fallback = "") => {
  const raw = String(value ?? "").trim() || String(fallback ?? "").trim();
  if (!raw) return null;

  if (KENDRA_ID_RE.test(raw)) {
    const id = raw.toUpperCase();
    return centres.find((c) => getCentreId(c.name) === id)?.name ?? null;
  }
  const key = getCanonicalCentreKey(raw);
  if (!key) return null;
  return centres.find((c) => getCanonicalCentreKey(c.name) === key)?.name ?? null;
};

module.exports = { MAX_USER_IMPORT_ROWS, normalizeImportRole, resolveImportCentre };
