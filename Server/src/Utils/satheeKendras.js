/**
 * SATHEE Kendras shown on the SATHEE platform page (from the SATHEE Kendra
 * Master List, Annexure III). Each is its own platform, separate from HCL
 * SATHEE. The HCL Kendras (RJ-JU-01, JH-EM-01, MP-BT-01) and SATHEE Barmer
 * (RJ-BA-01) on that list have their own cards and are not repeated here.
 *
 * Centre names may only use letters (digits are dropped when centres are
 * matched), so the five Erode Kendras are I-V; `label` is the name people
 * see (Erode 3). Mirrors SATHEE_KENDRAS in
 * Client/src/utils/satheeKendras.js.
 */
const SATHEE_KENDRAS = [
  { name: "SATHEE ITANAGAR", label: "Itanagar", id: "AR-PE-01" },
  { name: "SATHEE SOUTH EAST DELHI", label: "South East Delhi", id: "DL-SE-01" },
  { name: "SATHEE JAMMU", label: "Jammu", id: "JK-JU-01" },
  { name: "SATHEE SRINAGAR", label: "Srinagar", id: "JK-SR-01" },
  { name: "SATHEE DHAR", label: "Dhar", id: "MP-DR-01" },
  { name: "SATHEE DIMAPUR", label: "Dimapur", id: "NL-DR-01" },
  { name: "SATHEE KOHIMA", label: "Kohima", id: "NL-KA-01" },
  { name: "SATHEE SAMBALPUR", label: "Sambalpur", id: "OR-SA-01" },
  { name: "SATHEE ERODE I", label: "Erode 1", id: "TN-EE-01" },
  { name: "SATHEE ERODE II", label: "Erode 2", id: "TN-EE-02" },
  { name: "SATHEE ERODE III", label: "Erode 3", id: "TN-EE-03" },
  { name: "SATHEE ERODE IV", label: "Erode 4", id: "TN-EE-04" },
  { name: "SATHEE ERODE V", label: "Erode 5", id: "TN-EE-05" },
  { name: "SATHEE RANGA REDDY", label: "Ranga Reddy", id: "TL-RY-01" },
  { name: "SATHEE KANPUR NAGAR", label: "Kanpur Nagar", id: "UP-KP-01" },
  { name: "SATHEE DEHRADUN", label: "Dehradun", id: "UK-DN-01" },
  { name: "SATHEE UDHAM SINGH NAGAR", label: "Udham Singh Nagar", id: "UK-UR-01" },
];

module.exports = { SATHEE_KENDRAS };
