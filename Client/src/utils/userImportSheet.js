import * as XLSX from "xlsx";
import {
  displayRole,
  getCentreValueFromPortal,
  PORTAL_OPTIONS,
  STANDALONE_PORTALS,
} from "./portalMapping";
import { getCentreId } from "./centreDirectory";
import { SATHEE_KENDRAS } from "./satheeKendras";

/** Most rows one upload may contain (the server allows the same). */
export const MAX_IMPORT_ROWS = 200;

const KENDRA_ID_RE = /^[A-Z]{2}-[A-Z]{2}-\d{2}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLUMNS = [
  { key: "name", label: "Name", aliases: ["full name", "user name", "mitra name", "partner name"] },
  { key: "email", label: "Email", aliases: ["email address", "email id", "e mail", "mail"] },
  { key: "phone", label: "Phone", aliases: ["phone number", "phone no", "mobile", "mobile number", "mobile no", "contact", "contact number", "whatsapp"] },
  { key: "role", label: "Role", aliases: ["user role", "type", "designation"] },
  { key: "kendra", label: "Kendra ID", aliases: ["kendra", "kendra id", "kendra name", "centre", "center", "centre name", "center name"] },
];
const REQUIRED = ["name", "email", "phone", "role"];

const normalizeHeader = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const headerKey = (header) => {
  const norm = normalizeHeader(header);
  if (!norm) return null;
  return (
    COLUMNS.find(
      (c) => normalizeHeader(c.label) === norm || c.aliases.some((a) => normalizeHeader(a) === norm)
    )?.key ?? null
  );
};

/** Digits only, tolerating +91 and a leading 0. */
export const toPhone10 = (value = "") => {
  let d = String(value ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
};

const ROLE_ALIASES = {
  SATHEEMITRA: "SATHEE MITRA",
  MITRA: "SATHEE MITRA",
  MENTOR: "SATHEE MITRA",
  TEACHER: "SATHEE MITRA",
  HCLPARTNER: "HCL PARTNER",
  CSRPARTNER: "HCL PARTNER",
  PARTNER: "HCL PARTNER",
};

/** Same rules as the server: SATHEE MITRA or a partner; never admin. */
export const toRole = (value = "") =>
  ROLE_ALIASES[String(value ?? "").toUpperCase().replace(/[^A-Z]/g, "")] || null;

/** Every Kendra the app knows about: { id, name (stored centre), label }. */
export const knownKendras = () => [
  ...PORTAL_OPTIONS.map((p) => {
    const name = getCentreValueFromPortal(p.title);
    return { id: getCentreId(name), name, label: p.title };
  }),
  ...STANDALONE_PORTALS.map((p) => ({ id: getCentreId(p.title), name: p.title, label: p.label })),
  ...SATHEE_KENDRAS.map((k) => ({ id: k.id, name: k.name, label: `SATHEE ${k.label}` })),
];

/** Downloads the template: a Users sheet to fill in and a Kendra IDs list. */
export const downloadUserImportTemplate = (portalName) => {
  const kendras = knownKendras();
  const here = kendras.find((k) => k.name === getCentreValueFromPortal(portalName));
  const exampleId = here?.id || "UK-DN-01";
  const users = XLSX.utils.aoa_to_sheet([
    COLUMNS.map((c) => c.label),
    ["Asha Verma", "asha.verma@example.com", "9876543210", "SATHEE MITRA", exampleId],
    ["Ravi Kumar", "ravi.kumar@example.com", "9876500000", displayRole("HCL PARTNER", portalName), exampleId],
  ]);
  users["!cols"] = [{ wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 12 }];
  const list = XLSX.utils.aoa_to_sheet([
    ["Kendra ID", "Kendra"],
    ...kendras.filter((k) => k.id).map((k) => [k.id, k.label]),
  ]);
  list["!cols"] = [{ wch: 12 }, { wch: 34 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, users, "Users");
  XLSX.utils.book_append_sheet(wb, list, "Kendra IDs");
  XLSX.writeFile(wb, "sathee-users-import-template.xlsx");
};

/**
 * Reads the first sheet of a workbook into rows ready to send, each with a
 * friendly `issue` when something is clearly wrong before uploading.
 * Returns { rows, error, ignoredHeaders }.
 */
export const readUserImportWorkbook = (workbook) => {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { rows: [], error: "No readable sheet was found." };
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
  if (!aoa.length) return { rows: [], error: "The sheet is empty." };

  const headerMap = {};
  const ignoredHeaders = [];
  aoa[0].forEach((cell, idx) => {
    const header = String(cell ?? "").trim();
    if (!header) return;
    const key = headerKey(header);
    if (key && !Object.values(headerMap).includes(key)) headerMap[idx] = key;
    else ignoredHeaders.push(header);
  });
  const missing = REQUIRED.filter((k) => !Object.values(headerMap).includes(k)).map(
    (k) => COLUMNS.find((c) => c.key === k).label
  );
  if (missing.length) {
    return {
      rows: [],
      error: `Missing column(s): ${missing.join(", ")}. Download the template to see the expected headers.`,
    };
  }

  const kendraIds = new Set(knownKendras().map((k) => k.id).filter(Boolean));
  const seenEmails = new Set();
  const rows = [];
  for (let i = 1; i < aoa.length; i += 1) {
    const raw = { __row: i + 1 };
    let hasValue = false;
    Object.entries(headerMap).forEach(([idx, key]) => {
      const value = String(aoa[i]?.[idx] ?? "").trim();
      raw[key] = value;
      if (value) hasValue = true;
    });
    if (!hasValue) continue;

    const row = {
      __row: raw.__row,
      name: raw.name || "",
      email: (raw.email || "").toLowerCase(),
      phone: toPhone10(raw.phone),
      role: raw.role || "",
      kendra: (raw.kendra || "").toUpperCase().match(KENDRA_ID_RE) ? raw.kendra.toUpperCase() : raw.kendra || "",
    };
    let issue = null;
    if (!row.name) issue = "Name is missing";
    else if (!EMAIL_RE.test(row.email)) issue = "Email looks wrong";
    else if (row.phone.length !== 10) issue = "Phone must be 10 digits";
    else if (!toRole(row.role)) issue = "Role must be SATHEE MITRA or Partner";
    else if (KENDRA_ID_RE.test(row.kendra) && !kendraIds.has(row.kendra)) issue = `Unknown Kendra ID ${row.kendra}`;
    else if (seenEmails.has(row.email)) issue = "Same email appears earlier in the sheet";
    if (!issue) seenEmails.add(row.email);
    rows.push({ ...row, issue });
  }
  if (!rows.length) return { rows: [], error: "No people were found under the header row." };
  if (rows.length > MAX_IMPORT_ROWS) {
    return { rows: [], error: `That's ${rows.length} people; upload at most ${MAX_IMPORT_ROWS} at a time.` };
  }
  return { rows, error: "", ignoredHeaders };
};
