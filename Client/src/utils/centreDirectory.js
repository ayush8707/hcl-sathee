import { getCanonicalCentreKey } from "./portalMapping";

/**
 * Hardcoded per-centre directory info for the default centres — a
 * placeholder until centres get real ID/address fields on the backend.
 * Update this map (and swap it for a real lookup) once that lands. Custom
 * centres have none of this yet.
 */
const CENTRE_DIRECTORY_BY_KEY = {
  HCLRAJASTHAN: {
    id: "RJ-JU-01",
    place: "Jhunjhunu, Rajasthan",
    address: "Kendriye Vidhyalaya Khetri Nagar, Jhunjhunu, Rajasthan 333504",
  },
  HCLJHARKHAND: {
    id: "JH-EM-01",
    place: "East Singhbhum, Jharkhand",
    address: "HCL VTC SATHEE Kendra, Sohda, Jharkhand",
  },
  HCLMADHYAPRADESH: {
    id: "MP-BT-01",
    place: "Bhopal, Madhya Pradesh",
    address: "SATHEE Kendra Malanjkhand, Township DAV School Malanjkhand",
  },
  // Funded by Hero Future Energies (not part of HCL SATHEE).
  SATHEEBARMER: {
    id: "RJ-BA-01",
    place: "Shiv, Barmer, Rajasthan",
    address: "Government Senior Secondary School, Near Baba Garib Math Ji, Shiv, Rajasthan 344701",
  },
};

/** Accepts a centre name or a portal title (e.g. "HCL SATHEE RAJASTHAN"). */
export const getCentreDirectoryEntry = (centreNameOrPortalName = "") => {
  const key = getCanonicalCentreKey(centreNameOrPortalName);
  return CENTRE_DIRECTORY_BY_KEY[key] ?? null;
};

export const getCentreId = (centreNameOrPortalName = "") =>
  getCentreDirectoryEntry(centreNameOrPortalName)?.id ?? null;

export const getCentrePlace = (centreNameOrPortalName = "") =>
  getCentreDirectoryEntry(centreNameOrPortalName)?.place ?? null;

export const getCentreAddress = (centreNameOrPortalName = "") =>
  getCentreDirectoryEntry(centreNameOrPortalName)?.address ?? null;
