import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import {
  approveVishistAttendance,
  fetchDueVisits,
  fetchVishistAttendanceRange,
} from "../../services/vishistAttendance";
import { getCentreValueFromPortal } from "../../utils/portalMapping";
import { VishistStatus } from "./VishistStatus";

const DAYS = 30;
const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Waiting for approval" },
  { value: "approved", label: "Approved" },
  { value: "absent", label: "Didn't come" },
];

const isoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const niceDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

/**
 * Admin "SATHEE VISHIST" tab: the visits the SATHEE MITRA recorded over the
 * last 30 days, with Approve, and a note about visit days nobody answered.
 */
export default function VishistVisitsAdmin({ portalName, canApprove = false }) {
  const centre = getCentreValueFromPortal(portalName) || "";
  const [records, setRecords] = useState(null);
  const [unanswered, setUnanswered] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [approving, setApproving] = useState(null);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    let active = true;
    const to = new Date();
    const from = new Date(to);
    from.setDate(to.getDate() - (DAYS - 1));
    Promise.all([fetchVishistAttendanceRange(isoDate(from), isoDate(to), centre), fetchDueVisits(centre).catch(() => [])])
      .then(([rows, due]) => {
        if (!active) return;
        setRecords([...rows].sort((a, b) => String(b.date).localeCompare(String(a.date))));
        // Today's visit may simply not be answered yet; only older days count.
        setUnanswered(due.filter((v) => !v.isToday));
      })
      .catch(() => active && setError("Vishist visits could not be loaded right now."));
    return () => {
      active = false;
    };
  }, [centre]);

  const shown = useMemo(
    () => (records || []).filter((r) => filter === "all" || (r.status || "pending") === filter),
    [records, filter]
  );
  const waiting = (records || []).filter((r) => (r.status || "pending") === "pending");

  const approve = async (ids) => {
    setError("");
    for (const id of ids) {
      setApproving(id);
      try {
        await approveVishistAttendance(id);
        setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
      } catch (err) {
        setError(err?.response?.data?.message || "Approval didn't go through. Please try again.");
        break;
      }
    }
    setApproving(null);
  };

  return (
    <div className="space-y-4 p-5">
      {unanswered.length ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            The SATHEE MITRA hasn&apos;t said yet whether {unanswered.length === 1 ? "this visit" : "these visits"} happened:{" "}
            {unanswered.map((v) => `${v.name} (${niceDate(v.date)})`).join(", ")}.
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition ${
              filter === f.value ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
        {canApprove && waiting.length > 1 ? (
          <button
            type="button"
            disabled={approving !== null}
            onClick={() => approve(waiting.map((r) => r.id))}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <Check size={15} /> Approve all {waiting.length}
          </button>
        ) : null}
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p> : null}

      {records === null && !error ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading Vishist visits…</p>
      ) : !shown.length ? (
        <p className="py-10 text-center text-sm text-slate-500">
          {records?.length ? "No visits match this filter." : `No SATHEE Vishist visits recorded in the last ${DAYS} days.`}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-3 py-2.5">SATHEE Vishist</th>
                <th className="px-3 py-2.5">Subject · topic</th>
                <th className="px-3 py-2.5">Recorded by</th>
                <th className="px-3 py-2.5">Photo</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{niceDate(r.date)}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">{r.vishistName}</td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {[r.subject, r.topicTaught].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{r.markedByName || "—"}</td>
                  <td className="px-3 py-2.5">
                    {r.photoUrl ? (
                      <button type="button" onClick={() => setPhoto(r)} className="block">
                        <img src={r.photoUrl} alt={`${r.vishistName} on ${r.date}`} className="h-10 w-10 rounded-lg object-cover" />
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {canApprove && (r.status || "pending") === "pending" ? (
                      <button
                        type="button"
                        disabled={approving !== null}
                        onClick={() => approve([r.id])}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {approving === r.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                      </button>
                    ) : (
                      <VishistStatus status={r.status} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {photo ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4"
          onClick={() => setPhoto(null)}
          role="presentation"
        >
          <figure className="max-w-lg">
            <img src={photo.photoUrl} alt={photo.vishistName} className="max-h-[80vh] w-full rounded-xl object-contain" />
            <figcaption className="mt-2 text-center text-sm text-white">
              {photo.vishistName} · {niceDate(photo.date)}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  );
}
