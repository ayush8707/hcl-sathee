import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchMitraAttendanceRange } from "../../services/mitraAttendance";
import { fetchMyLeaveRequests } from "../../services/leaveRequests";
import { WEEKDAYS } from "../../utils/availableDays";

const pad = (n) => String(n).padStart(2, "0");
const isoDay = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayIso = () => {
  const now = new Date();
  return isoDay(now.getFullYear(), now.getMonth(), now.getDate());
};
// JS getDay(): 0 = Sunday. WEEKDAYS starts on Monday.
const weekdayName = (y, m, d) => WEEKDAYS[(new Date(y, m, d).getDay() + 6) % 7];

const hoursBetween = (from, to) => {
  if (!from || !to) return null;
  const hours = (new Date(to) - new Date(from)) / 3600000;
  return hours > 0 && hours < 24 ? hours : null;
};

const formatHours = (hours) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m ? `${h}h ${m}m` : `${h}h`;
};

const STYLES = {
  present: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  partial: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  leave: "bg-amber-100 text-amber-800 ring-amber-200",
  absent: "bg-red-50 text-red-700 ring-red-200",
  off: "bg-slate-50 text-slate-400 ring-slate-100",
  future: "bg-white text-slate-400 ring-slate-100",
};

/**
 * A SATHEE MITRA's own month: present / leave / absent days, totals and hours.
 * `availableDays` (e.g. ["Monday", ...]) marks working days; without it,
 * Monday to Saturday count as working days.
 */
export default function MyMonthCalendar({ userId, availableDays, refreshKey }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const [records, setRecords] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState("");

  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const from = isoDay(cursor.y, cursor.m, 1);
  const to = isoDay(cursor.y, cursor.m, daysInMonth);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    Promise.all([fetchMitraAttendanceRange(from, to), fetchMyLeaveRequests().catch(() => [])])
      .then(([rows, myLeaves]) => {
        if (!active) return;
        setRecords(rows.filter((r) => String(r.userId) === String(userId)));
        setLeaves(myLeaves.filter((l) => String(l.status || "").toLowerCase() === "approved"));
        setError("");
      })
      .catch(() => active && setError("Your month could not be loaded."));
    return () => {
      active = false;
    };
  }, [userId, from, to, refreshKey]);

  const month = useMemo(() => {
    const byDate = new Map((records || []).map((r) => [String(r.date).slice(0, 10), r]));
    const onLeave = (day) => leaves.some((l) => l.fromDate && l.toDate && day >= l.fromDate && day <= l.toDate);
    const workdays = Array.isArray(availableDays) && availableDays.length ? new Set(availableDays) : null;
    const today = todayIso();
    const days = [];
    const totals = { present: 0, leave: 0, absent: 0, hours: 0 };

    for (let d = 1; d <= daysInMonth; d += 1) {
      const day = isoDay(cursor.y, cursor.m, d);
      const weekday = weekdayName(cursor.y, cursor.m, d);
      const isWorkday = workdays ? workdays.has(weekday) : weekday !== "Sunday";
      const record = byDate.get(day);
      const hours = record ? hoursBetween(record.arrivalTime, record.departureTime) : null;
      let state;
      if (record?.arrivalTime) state = record.departureTime ? "present" : "partial";
      else if (!isWorkday) state = "off"; // a leave over a day off doesn't count as leave
      else if (onLeave(day)) state = "leave";
      else if (day >= today) state = "future"; // today isn't over yet
      else state = "absent";

      if (state === "present" || state === "partial") totals.present += 1;
      if (state === "leave") totals.leave += 1;
      if (state === "absent") totals.absent += 1;
      if (hours) totals.hours += hours;
      days.push({ d, day, state, hours, isToday: day === today });
    }
    return { days, totals, leadingBlanks: (new Date(cursor.y, cursor.m, 1).getDay() + 6) % 7 };
  }, [records, leaves, availableDays, cursor, daysInMonth]);

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const isCurrentMonth = from.slice(0, 7) === todayIso().slice(0, 7);
  const shift = (delta) =>
    setCursor(({ y, m }) => {
      const next = new Date(y, m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">My month</h3>
          <p className="text-xs text-slate-500">Your attendance, leave and hours worked.</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-slate-800">{monthLabel}</span>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={isCurrentMonth}
            aria-label="Next month"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Present", month.totals.present, "text-emerald-700"],
          ["Leave", month.totals.leave, "text-amber-700"],
          ["Absent", month.totals.absent, "text-red-700"],
          ["Hours worked", month.totals.hours ? formatHours(month.totals.hours) : "0h", "text-slate-800"],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`text-lg font-bold ${tone}`}>{records == null && !error ? "—" : value}</p>
          </div>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
          <div key={w} className="text-[11px] font-semibold uppercase text-slate-400">
            {w}
          </div>
        ))}
        {Array.from({ length: month.leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {month.days.map(({ d, day, state, hours, isToday }) => (
          <div
            key={day}
            title={hours ? `${formatHours(hours)} worked` : state}
            className={`flex h-12 flex-col items-center justify-center rounded-lg text-sm font-semibold ring-1 ring-inset sm:h-14 ${STYLES[state]} ${
              isToday ? "outline outline-2 outline-blue-500" : ""
            }`}
          >
            {d}
            {hours ? <span className="text-[9px] font-medium leading-none opacity-80">{formatHours(hours)}</span> : null}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-200" /> Present</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-200" /> Leave</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-50 ring-1 ring-red-200" /> Absent</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-50 ring-1 ring-slate-200" /> Day off</span>
      </div>
    </section>
  );
}
