/**
 * SATHEE Kendras shown on the SATHEE platform page (from the SATHEE Kendra
 * Master List, Annexure III). Each is its own platform, separate from HCL
 * SATHEE. The HCL Kendras (RJ-JU-01, JH-EM-01, MP-BT-01) and SATHEE Barmer
 * (RJ-BA-01) on that list have their own cards and are not repeated here.
 *
 * `name` is the stored centre name. It may only use letters (digits are
 * dropped when centres are matched), so the five Erode Kendras are I-V;
 * `label` is what the card shows. Mirrors Server/src/Utils/satheeKendras.js.
 */
export const SATHEE_KENDRAS = [
  { name: "SATHEE ITANAGAR", label: "Itanagar", id: "AR-PE-01", district: "Itanagar, Papum Pare", state: "Arunachal Pradesh" },
  { name: "SATHEE SOUTH EAST DELHI", label: "South East Delhi", id: "DL-SE-01", district: "South East Delhi", state: "Delhi" },
  { name: "SATHEE JAMMU", label: "Jammu", id: "JK-JU-01", district: "Jammu", state: "Jammu & Kashmir" },
  { name: "SATHEE SRINAGAR", label: "Srinagar", id: "JK-SR-01", district: "Srinagar", state: "Jammu & Kashmir" },
  { name: "SATHEE DHAR", label: "Dhar", id: "MP-DR-01", district: "Dhar", state: "Madhya Pradesh" },
  { name: "SATHEE DIMAPUR", label: "Dimapur", id: "NL-DR-01", district: "Dimapur", state: "Nagaland" },
  { name: "SATHEE KOHIMA", label: "Kohima", id: "NL-KA-01", district: "Kohima", state: "Nagaland" },
  { name: "SATHEE SAMBALPUR", label: "Sambalpur", id: "OR-SA-01", district: "Sambalpur", state: "Odisha" },
  { name: "SATHEE ERODE I", label: "Erode 1", id: "TN-EE-01", district: "Erode", state: "Tamil Nadu" },
  { name: "SATHEE ERODE II", label: "Erode 2", id: "TN-EE-02", district: "Erode", state: "Tamil Nadu" },
  { name: "SATHEE ERODE III", label: "Erode 3", id: "TN-EE-03", district: "Erode", state: "Tamil Nadu" },
  { name: "SATHEE ERODE IV", label: "Erode 4", id: "TN-EE-04", district: "Erode", state: "Tamil Nadu" },
  { name: "SATHEE ERODE V", label: "Erode 5", id: "TN-EE-05", district: "Erode", state: "Tamil Nadu" },
  { name: "SATHEE RANGA REDDY", label: "Ranga Reddy", id: "TL-RY-01", district: "Ranga Reddy", state: "Telangana" },
  { name: "SATHEE KANPUR NAGAR", label: "Kanpur Nagar", id: "UP-KP-01", district: "Kanpur Nagar", state: "Uttar Pradesh" },
  { name: "SATHEE DEHRADUN", label: "Dehradun", id: "UK-DN-01", district: "Dehradun", state: "Uttarakhand" },
  { name: "SATHEE UDHAM SINGH NAGAR", label: "Udham Singh Nagar", id: "UK-UR-01", district: "Udham Singh Nagar", state: "Uttarakhand" },
];
