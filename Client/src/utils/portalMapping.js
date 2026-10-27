// Order matters: Barmer is also in Rajasthan, so its rule must come before the
// state-wide Rajasthan (Jhunjhunu) rule.
const CENTRE_RULES = [
  { patterns: ["BARMER"], key: "SATHEEBARMER", label: "SATHEE BARMER" },
  { patterns: ["RAJASTHAN", "RAJATHAN"], key: "HCLRAJASTHAN", label: "HCL RAJASTHAN" },
  { patterns: ["JHARKHAND"], key: "HCLJHARKHAND", label: "HCL JHARKHAND" },
  { patterns: ["MADHYAPRADESH"], key: "HCLMADHYAPRADESH", label: "HCL MADHYA PRADESH" },
];

// Records without a centre (e.g. admin accounts) arrive as null.
const normalizeCentreValue = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

const matchCentreRule = (normalized) =>
  CENTRE_RULES.find((rule) => rule.patterns.some((pattern) => normalized.includes(pattern)));

export const getCanonicalCentreKey = (value = "") => {
  const normalized = normalizeCentreValue(value);
  return matchCentreRule(normalized)?.key ?? normalized;
};

export const getCentreValueFromPortal = (portalName = "") => {
  const rule = matchCentreRule(normalizeCentreValue(portalName));
  if (rule) return rule.label;
  // Dynamically-added centres have no rule — the portal name is already the
  // centre value (e.g. "HCL UTTAR PRADESH").
  const trimmed = String(portalName ?? "").trim();
  return trimmed || null;
};

export const matchesPortalCentre = (centreValue, portalName = "") => {
  const portalKey = getCanonicalCentreKey(portalName);
  if (!portalKey) return true;
  return getCanonicalCentreKey(centreValue) === portalKey;
};

export const canAccessPortal = (userCentre, portalName = "", userRole = "") => {
  const role = String(userRole || "").trim().toUpperCase();
  if (role === "ADMIN") return true;
  if (!userCentre) return false;
  return matchesPortalCentre(userCentre, portalName);
};

export const isAdminRole = (userRole = "") =>
  String(userRole || "").trim().toUpperCase() === "ADMIN";

export const isHclPartnerRole = (userRole = "") =>
  String(userRole || "").trim().toUpperCase() === "HCL PARTNER";

export const isSatheeMitraRole = (userRole = "") =>
  String(userRole || "").trim().toUpperCase() === "SATHEE MITRA";

export const canEnterAdminDashboard = (userRole = "") => isAdminRole(userRole);

export const canEnterPartnerDashboard = (userRole = "") => isHclPartnerRole(userRole);

export const canEnterSatheeMitraDashboard = (userRole = "") => isSatheeMitraRole(userRole);

export const PORTAL_OPTIONS = [
  { title: "HCL SATHEE RAJASTHAN", subtitle: "Rajasthan Learning Portal" },
  { title: "HCL SATHEE JHARKHAND", subtitle: "Jharkhand Learning Portal" },
  { title: "HCL SATHEE MADHYA PRADESH", subtitle: "Madhya Pradesh Learning Portal" },
];

// Kendras that are their own platform rather than part of HCL SATHEE. They get
// a card on the first "Choose Your Platform" screen instead of the state list.
// `partner` is the CSR partner that funds the Kendra.
export const STANDALONE_PORTALS = [
  {
    title: "SATHEE BARMER",
    label: "SATHEE Barmer",
    subtitle: "SATHEE Kendra, Shiv (Barmer), Rajasthan",
    partner: "Hero Future Energies",
  },
];

const STANDALONE_KEYS = new Set(STANDALONE_PORTALS.map((p) => getCanonicalCentreKey(p.title)));

export const isStandalonePortal = (portalOrCentreName = "") =>
  STANDALONE_KEYS.has(getCanonicalCentreKey(portalOrCentreName));

export const getStandalonePartnerName = (portalOrCentreName = "") => {
  const key = getCanonicalCentreKey(portalOrCentreName);
  return STANDALONE_PORTALS.find((p) => getCanonicalCentreKey(p.title) === key)?.partner ?? null;
};

// True when `centre` belongs to the same platform as `portalOrCentre`: a
// standalone Kendra only matches itself; HCL centres match each other.
export const isSamePlatform = (centre, portalOrCentre) =>
  isStandalonePortal(portalOrCentre)
    ? getCanonicalCentreKey(centre) === getCanonicalCentreKey(portalOrCentre)
    : !isStandalonePortal(centre);

// The partner role is stored as "HCL PARTNER" for every centre. Standalone
// Kendras are funded by other CSR partners, so their screens call it
// "CSR PARTNER" instead. Display only — the stored role never changes.
export const displayRole = (role = "", portalName = "") =>
  isStandalonePortal(portalName) && String(role || "").trim().toUpperCase() === "HCL PARTNER"
    ? "CSR PARTNER"
    : role;
