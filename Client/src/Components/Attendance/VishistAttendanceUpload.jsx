import { useCallback, useEffect, useState } from "react";
import { fetchVishistAttendanceRange } from "../../services/vishistAttendance";
import { VishistDueCard } from "./VishistDueCard";
import { VishistStatus } from "./VishistStatus";

const RECENT_DAYS = 30;

const isoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const niceDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/**
 * SATHEE MITRA's "Vishist Attendance" screen: answer "Did they come?" for
 * any visit waiting, then see the Kendra's recent Vishist visits.
 */
export default function VishistAttendanceUpload({ portalName, isCustomCentre = false }) {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(to.getDate() - (RECENT_DAYS - 1));
    try {
      const rows = await fetchVishistAttendanceRange(isoDate(from), isoDate(to), portalName);
      setRecords([...rows].sort((a, b) => String(b.date).localeCompare(String(a.date))));
    } catch {
      setError("Recent visits could not be loaded right now.");
    }
  }, [portalName]);

  useEffect(() => {
    let active = true;
    const to = new Date();
    const from = new Date(to);
    from.setDate(to.getDate() - (RECENT_DAYS - 1));
    fetchVishistAttendanceRange(isoDate(from), isoDate(to), portalName)
      .then((rows) => active && setRecords([...rows].sort((a, b) => String(b.date).localeCompare(String(a.date)))))
      .catch(() => active && setError("Recent visits could not be loaded right now."));
    return () => {
      active = false;
    };
  }, [portalName]);

  if (isCustomCentre) {
    return <p className="px-6 py-10 text-center text-sm text-slate-500">Vishist attendance isn&apos;t available for this centre.</p>;
  }

  return (
    <div className="space-y-6">
      <VishistDueCard portalName={portalName} showEmpty onRecorded={load} />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h3 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
          Recent Vishist visits (last {RECENT_DAYS} days)
        </h3>
        {error ? (
          <p className="px-5 py-6 text-sm text-red-700">{error}</p>
        ) : records === null ? (
          <p className="px-5 py-6 text-sm text-slate-400">Loading…</p>
        ) : !records.length ? (
          <p className="px-5 py-6 text-sm text-slate-500">No visits recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {records.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                {r.photoUrl ? (
                  <img src={r.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="h-11 w-11 shrink-0 rounded-lg bg-slate-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{r.vishistName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {niceDate(r.date)}
                    {r.subject ? ` · ${r.subject}` : ""}
                    {r.topicTaught ? ` · ${r.topicTaught}` : ""}
                  </p>
                </div>
                <VishistStatus status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
