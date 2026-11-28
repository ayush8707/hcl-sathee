import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck } from "lucide-react";
import { loadTimetableForPortal } from "../../services/timetables";
import { fetchDailySubjectAttendance } from "../../services/dailySubjectAttendance";
import { getTodaysClasses } from "../../utils/todayClasses";
import { classSubjectFor } from "../../utils/combinedBatches";
import { getCentreValueFromPortal } from "../../utils/portalMapping";

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * SATHEE MITRA dashboard: which of today's timetable classes still have no
 * attendance saved, with a button straight to marking them.
 */
export function UnmarkedClassesCard({ portalName, students = [], loadingStudents = false, onMarkNow }) {
  const [state, setState] = useState(null); // { total, unmarked: [{ time, label }] }

  useEffect(() => {
    if (loadingStudents) return undefined;
    let active = true;
    (async () => {
      try {
        const { timetable } = await loadTimetableForPortal(portalName, { canMigrate: false });
        const { classes } = getTodaysClasses(timetable);
        // Only classes that have students (same rule as the marking screen).
        const withStudents = classes
          .map((classItem) => ({
            classItem,
            ids: new Set(
              students.filter((s) => classSubjectFor(s, classItem, classes)).map((s) => String(s.id))
            ),
          }))
          .filter((c) => c.ids.size);
        const centre = getCentreValueFromPortal(portalName) || "";
        const date = todayIso();
        const marked = await Promise.all(
          withStudents.map(async ({ classItem, ids }) => {
            const records = await fetchDailySubjectAttendance({
              date,
              subject: classItem.subject,
              time: classItem.time || "",
              centre,
            });
            return records.some((r) => ids.has(String(r.studentId)));
          })
        );
        if (!active) return;
        setState({
          total: withStudents.length,
          unmarked: withStudents
            .filter((_, i) => !marked[i])
            .map(({ classItem }) => ({
              time: classItem.time,
              label: classItem.course ? `${classItem.course} – ${classItem.subject}` : classItem.subject,
            })),
        });
      } catch {
        if (active) setState(null); // the reminder is a helper: stay quiet if it can't load
      }
    })();
    return () => {
      active = false;
    };
  }, [portalName, students, loadingStudents]);

  if (!state?.total) return null;

  if (!state.unmarked.length) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800">
        <CheckCircle2 size={18} className="shrink-0" />
        All {state.total} of today&apos;s classes are marked. Well done!
      </p>
    );
  }

  const done = state.total - state.unmarked.length;
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-amber-900">
              {state.unmarked.length} {state.unmarked.length === 1 ? "class" : "classes"} not marked yet today
            </h3>
            <p className="text-sm text-amber-800">
              {done} of {state.total} marked so far.
            </p>
          </div>
        </div>
        {onMarkNow ? (
          <button
            type="button"
            onClick={onMarkNow}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            <ClipboardCheck size={16} /> Mark now
          </button>
        ) : null}
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {state.unmarked.map((c) => (
          <li
            key={`${c.time}-${c.label}`}
            className="rounded-full bg-white px-3 py-1 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-200"
          >
            {c.time ? `${c.time} · ` : ""}
            {c.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
