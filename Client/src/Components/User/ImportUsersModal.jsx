import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AlertTriangle, CheckCircle2, Copy, Download, FileSpreadsheet, Loader2, Mail, UploadCloud, X } from "lucide-react";
import { displayRole, getCentreValueFromPortal } from "../../utils/portalMapping";
import { downloadUserImportTemplate, knownKendras, readUserImportWorkbook, toRole } from "../../utils/userImportSheet";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

const kendraLabel = (value, fallback) => {
  const v = String(value || fallback || "").trim();
  const match = knownKendras().find((k) => k.id === v.toUpperCase() || k.name === v.toUpperCase());
  return match ? `${match.label}${match.id ? ` (${match.id})` : ""}` : v;
};

/**
 * "Import from Excel" on Users & Roles: add many SATHEE MITRAs / partners at
 * once. Shows a preview with problems marked before anything is saved, then
 * a report of who was added, who got an invite email and which rows failed.
 */
export default function ImportUsersModal({ open, onClose, onImport, portalName }) {
  const defaultCentre = getCentreValueFromPortal(portalName) || "";
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [ignored, setIgnored] = useState([]);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState("");

  useEscapeToClose(() => !importing && close(), open);
  if (!open) return null;

  const reset = () => {
    setFileName("");
    setRows([]);
    setError("");
    setIgnored([]);
    setReport(null);
    setCopied("");
  };
  function close() {
    reset();
    onClose();
  }

  const readFile = async (file) => {
    reset();
    if (!file) return;
    setFileName(file.name);
    try {
      const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
      const parsed = readUserImportWorkbook(wb);
      setRows(parsed.rows);
      setError(parsed.error);
      setIgnored(parsed.ignoredHeaders || []);
    } catch (err) {
      console.error("User import parse error:", err);
      setError("Could not read that file. Use an Excel (.xlsx, .xls) or .csv file.");
    }
  };

  const ready = rows.filter((r) => !r.issue);
  const skipped = rows.filter((r) => r.issue);

  const runImport = async () => {
    if (!ready.length || importing) return;
    setImporting(true);
    setError("");
    try {
      const result = await onImport(
        ready.map((r) => ({ __row: r.__row, name: r.name, email: r.email, phone: r.phone, role: r.role, kendra: r.kendra })),
        defaultCentre
      );
      // Rows held back in the preview count as failed in the report too.
      const held = skipped.map((r) => ({ row: r.__row, name: r.name, email: r.email, ok: false, message: r.issue }));
      setReport({
        ...result,
        total: result.total + held.length,
        failed: result.failed + held.length,
        results: [...result.results, ...held].sort((a, b) => a.row - b.row),
      });
    } catch (err) {
      console.error("User import error:", err);
      setError(err?.response?.data?.message || "The import didn't go through. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const copyLink = async (link, key) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(key);
    } catch {
      setCopied("");
    }
  };

  const failed = report?.results.filter((r) => !r.ok) ?? [];
  const noEmail = report?.results.filter((r) => r.ok && !r.emailSent) ?? [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !importing) close();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <FileSpreadsheet size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Import users from Excel</h2>
              <p className="text-sm text-slate-500">Add many SATHEE MITRAs and partners at once. Each gets an invite email.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={importing}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {report ? (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Added" value={report.created} tone="ok" />
                <Stat label="Invites emailed" value={report.emailsSent} tone="ok" />
                <Stat label="Not added" value={report.failed} tone={report.failed ? "bad" : "muted"} />
              </div>

              {failed.length ? (
                <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                  <p className="mb-2 text-sm font-semibold text-red-700">Not added: fix these rows and upload them again</p>
                  <ul className="max-h-56 space-y-1.5 overflow-y-auto text-sm">
                    {failed.map((r) => (
                      <li key={r.row} className="flex gap-3">
                        <span className="w-14 shrink-0 font-semibold text-slate-700">Row {r.row}</span>
                        <span className="min-w-0 text-slate-700">
                          {r.name || r.email || "—"}: <span className="text-red-700">{r.message}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {noEmail.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <p className="mb-2 text-sm font-semibold text-amber-800">
                    Added, but the invite email didn't send. Copy each person's link and send it to them (it works for 24 hours), or use Resend later.
                  </p>
                  <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
                    {noEmail.map((r) => (
                      <li key={r.row} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-slate-700">{r.name} · {r.email}</span>
                        {r.passwordSetupLink ? (
                          <button
                            type="button"
                            onClick={() => copyLink(r.passwordSetupLink, r.row)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Copy size={13} />
                            {copied === r.row ? "Copied" : "Copy link"}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!failed.length && !noEmail.length ? (
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={18} /> Everyone was added and invited.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-600">
                  Columns: <strong>Name, Email, Phone, Role, Kendra ID</strong>. Role is SATHEE MITRA or{" "}
                  {displayRole("HCL PARTNER", portalName)}.
                </p>
                <button
                  type="button"
                  onClick={() => downloadUserImportTemplate(portalName)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Download size={15} /> Download template
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/30"
              >
                <UploadCloud size={30} className="text-blue-500" />
                <span className="text-sm font-semibold text-slate-800">{fileName || "Choose an Excel file"}</span>
                <span className="text-xs text-slate-500">
                  Rows with an empty Kendra ID go to <strong>{kendraLabel(defaultCentre)}</strong>
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={(e) => {
                  readFile(e.target.files?.[0] || null);
                  e.target.value = "";
                }}
              />

              {error ? (
                <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
                </p>
              ) : null}
              {ignored.length ? (
                <p className="text-xs text-slate-500">Ignored columns: {ignored.join(", ")}</p>
              ) : null}

              {rows.length ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
                    <span className="font-semibold text-emerald-700">{ready.length} ready</span>
                    {skipped.length ? <span className="font-semibold text-red-700">{skipped.length} need fixing (will be skipped)</span> : null}
                  </div>
                  <div className="max-h-72 overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Role</th>
                          <th className="px-3 py-2">Kendra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((r) => (
                          <tr key={r.__row} className={r.issue ? "bg-red-50/50" : ""}>
                            <td className="px-3 py-2 text-slate-500">{r.__row}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">
                              {r.name || "—"}
                              {r.issue ? <span className="block text-xs font-normal text-red-700">{r.issue}</span> : null}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{r.email}</td>
                            <td className="px-3 py-2 text-slate-600">
                              {toRole(r.role) ? displayRole(toRole(r.role), portalName) : r.role}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{kendraLabel(r.kendra, defaultCentre)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          {report ? (
            <>
              <button type="button" onClick={reset} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Import more
              </button>
              <button type="button" onClick={close} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Done
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={close} disabled={importing} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={runImport}
                disabled={!ready.length || importing}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {importing ? "Adding and sending invites…" : `Add ${ready.length || ""} ${ready.length === 1 ? "user" : "users"} & send invites`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color = tone === "ok" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-slate-700";
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
