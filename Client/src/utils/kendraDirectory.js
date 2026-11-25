import { getCanonicalCentreKey, isStandalonePortal, PORTAL_OPTIONS, STANDALONE_PORTALS } from "./portalMapping";
import { getCentreDirectoryEntry } from "./centreDirectory";
import { getPortalPartner } from "../config/csrPartners";

export const OTHER_STATE = "Other";

/**
 * Every SATHEE Kendra on this platform, whoever funds it: the HCL SATHEE
 * portals, standalone Kendras (e.g. Barmer) and centres added from the State
 * Portals page. Each entry is what the Kendras directory page needs.
 *
 * `addedCentres` is the list from fetchCentres(); built-in ones are skipped.
 */
export const buildKendraDirectory = (addedCentres = []) => {
  const builtIn = [...PORTAL_OPTIONS.map((o) => o.title), ...STANDALONE_PORTALS.map((p) => p.title)];
  const builtInKeys = new Set(builtIn.map((title) => getCanonicalCentreKey(title)));
  const added = addedCentres
    .map((centre) => centre?.name)
    .filter((name) => name && !builtInKeys.has(getCanonicalCentreKey(name)) && !isStandalonePortal(name));

  return [...builtIn, ...added].map((title) => {
    const entry = getCentreDirectoryEntry(title);
    // place is "Town, State" or "Town, District, State": the state is the last part.
    const parts = (entry?.place || "").split(",").map((p) => p.trim()).filter(Boolean);
    const partner = getPortalPartner(title);
    return {
      title,
      // Standalone Kendras keep their own name (SATHEE Barmer); HCL ones show the town.
      name: STANDALONE_PORTALS.find((p) => p.title === title)?.label || parts[0] || title.replace(/^HCL\s+(SATHEE\s+)?/i, ""),
      state: parts.length > 1 ? parts.at(-1) : OTHER_STATE,
      place: entry?.place || null,
      address: entry?.address || null,
      kendraId: entry?.id || null,
      partnerName: partner.name,
      partnerLogo: partner.logo,
    };
  });
};

/** Groups Kendras by state, states A–Z with "Other" last. */
export const groupByState = (kendras) => {
  const groups = new Map();
  for (const kendra of kendras) {
    if (!groups.has(kendra.state)) groups.set(kendra.state, []);
    groups.get(kendra.state).push(kendra);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === OTHER_STATE) - (b === OTHER_STATE) || a.localeCompare(b))
    .map(([state, items]) => ({ state, kendras: items.sort((x, y) => x.name.localeCompare(y.name)) }));
};
