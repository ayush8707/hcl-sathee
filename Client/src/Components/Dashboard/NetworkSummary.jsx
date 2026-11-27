import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Network, RefreshCw } from "lucide-react";
import { fetchNetworkSummary } from "../../services/centres";
import { getCanonicalCentreKey } from "../../utils/portalMapping";
import { SATHEE_KENDRAS } from "../../utils/satheeKendras";
import { LOW_ATTENDANCE } from "../../utils/kendraReport";
import { downloadTableXlsx } from "../../utils/exportTable";

const GROUPS = ["All", "HCL SATHEE", "SATHEE Barmer", "SATHEE"];
const GROUP_ORDER = { "HCL SATHEE": 0, "SATHEE Barmer": 1, SATHEE: 2 };
const SORTS = [
  { value: "kendra", label: "By platform" },
  { value: "attendance", label: "Lowest attendance first" },
  { value: "students", label: "Most students first" },
];

const titleCase = (value) => value.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());

/** "HCL RAJASTHAN" -> "HCL Rajasthan", "SATHEE ERODE III" -> "SATHEE Erode 3". */
const kendraName = (row) => {
  const listed = SATHEE_KENDRAS.find((k) => getCanonicalCentreKey(k.name) === getCanonicalCentreKey(row.name));
  if (listed) return `SATHEE ${listed.label}`;
  if (row.group !== "HCL SATHEE") return row.platform;
  return `HCL ${titleCase(row.name.replace(/^HCL\s+/i, ""))}`;
};

const pctTone = (pct) =>
  pct == null ? "text-slate-400" : pct < 50 ? "text-red-700" : pct < LOW_ATTENDANCE ? "text-amber-700" : "text-emerald-700";
const barTone = (pct) => (pct < 50 ? "bg-red-500" : pct < LOW_ATTENDANCE ? "bg-amber-500" : "bg-emerald-500");

/** Attendance over several Kendras, weighted by how many marks each has. */
const combinedPct = (rows) => {
  const marks = rows.reduce((sum, r) => sum + (r.attendancePct == null ? 0 : r.attendanceMarks), 0);
  if (!marks) return null;
  const present = rows.reduce((sum, r) => sum + (r.attendancePct == null ? 0 : (r.attendancePct / 100) * r.attendanceMarks), 0);
  return Math.round((present / marks) * 1000) / 10;
};

/**
 * Admin dashboard: every Kendra on every platform side by side, so the
 * whole network can be checked from one place.
 */
export function NetworkSummary() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState("All");
  const [sort, setSort] = useState("kendra");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchNetworkSummary());
    } catch {
      setError("The network summary could not be loaded right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchNetworkSummary()
      .then((result) => active && setData(result))
      .catch(() => active && setError("The network summary could not be loaded right now."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const all = useMemo(() => (data?.kendras || []).map((r) => ({ ...r, label: kendraName(r) })), [data]);
  const countFor = (g) => (g === "All" ? all.length : all.filter((r) => r.group === g).length);

  const rows = useMemo(() => {
    const shown = group === "All" ? all : all.filter((r) => r.group === group);
    const byKendra = (a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || a.label.localeCompare(b.label);
    return [...shown].sort((a, b) => {
      if (sort === "students") return b.students - a.students || byKendra(a, b);
      if (sort === "attendance") {
        if (a.attendancePct == null || b.attendancePct == null) {
          return (a.attendancePct == null) - (b.attendancePct == null) || byKendra(a, b);
        }
        return a.attendancePct - b.attendancePct || byKendra(a, b);
      }
      return byKendra(a, b);
    });
  }, [all, group, sort]);

  const totals = useMemo(
    () => ({
      kendras: rows.length,
      students: rows.reduce((s, r) => s + r.students, 0),
      mitras: rows.reduce((s, r) => s + r.satheeMitras, 0),
      checkedIn: rows.reduce((s, r) => s + r.mitrasCheckedInToday, 0),
      pending: rows.reduce((s, r) => s + r.pendingApprovals, 0),
      attendance: combinedPct(rows),
      low: rows.filter((r) => r.attendancePct != null && r.attendancePct < LOW_ATTENDANCE).length,
    }),
    [rows]
  );

  const exportRows = () =>
    downloadTableXlsx({
      headers: [
        "Kendra ID",
        "Kendra",
        "Platform",
        "Students",
        "SATHEE MITRAs",
        "Partners",
        `Student attendance, last ${data?.attendanceDays ?? 7} days (%)`,
        "SATHEE MITRAs checked in today",
        "Approvals waiting",
      ],
      rows: rows.map((r) => [
        r.kendraId || "",
        r.label,
        r.group,
        r.students,
        r.satheeMitras,
        r.partners,
        r.attendancePct ?? "No marks yet",
        r.mitrasCheckedInToday,
        r.pendingApprovals,
      ]),
      filename: `sathee-network-summary-${data?.today || "today"}`,
      sheetName: "Network summary",
    });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Network size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">Network summary</h2>
            <p className="text-sm text-slate-500">
              Every Kendra side by side. Student attendance covers the last {data?.attendanceDays ?? 7} days.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            title="Refresh"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={exportRows}
            disabled={!rows.length}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {error ? (
        <p className="px-5 py-6 text-sm text-red-700">{error}</p>
      ) : (
        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={group === g}
                onClick={() => setGroup(g)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition ${
                  group === g ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {g} <span className={group === g ? "text-blue-100" : "text-slate-400"}>{countFor(g)}</span>
              </button>
            ))}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort Kendras"
              className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Tile label="Kendras" value={totals.kendras} />
            <Tile label="Students" value={totals.students} />
            <Tile label="SATHEE MITRAs" value={totals.mitras} />
            <Tile
              label="Student attendance"
              value={totals.attendance == null ? "—" : `${totals.attendance}%`}
              tone={pctTone(totals.attendance)}
              note={totals.low ? `${totals.low} Kendra${totals.low === 1 ? "" : "s"} below ${LOW_ATTENDANCE}%` : null}
            />
            <Tile label="MITRAs checked in today" value={`${totals.checkedIn} / ${totals.mitras}`} />
            <Tile label="Approvals waiting" value={totals.pending} tone={totals.pending ? "text-amber-700" : undefined} />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Kendra</th>
                  <th className="px-3 py-2.5 text-right">Students</th>
                  <th className="px-3 py-2.5 text-right">SATHEE MITRAs</th>
                  <th className="px-3 py-2.5 text-right">Partners</th>
                  <th className="px-3 py-2.5">Attendance</th>
                  <th className="px-3 py-2.5 text-right">Checked in today</th>
                  <th className="px-4 py-2.5 text-right">Approvals waiting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && !data ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Loading every Kendra…
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.name} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {r.kendraId ? (
                            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                              {r.kendraId}
                            </span>
                          ) : null}
                          <span className="font-medium text-slate-900">{r.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{r.students}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{r.satheeMitras}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{r.partners}</td>
                      <td className="px-3 py-2.5">
                        {r.attendancePct == null ? (
                          <span className="text-xs text-slate-400">No marks yet</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full ${barTone(r.attendancePct)}`} style={{ width: `${r.attendancePct}%` }} />
                            </div>
                            <span className={`tabular-nums font-semibold ${pctTone(r.attendancePct)}`}>{r.attendancePct}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                        {r.satheeMitras ? `${r.mitrasCheckedInToday} / ${r.satheeMitras}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {r.pendingApprovals ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                            {r.pendingApprovals}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function Tile({ label, value, tone = "text-slate-900", note = null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <p className={`text-xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {note ? <p className="mt-0.5 text-[11px] font-medium text-amber-700">{note}</p> : null}
    </div>
  );
}
