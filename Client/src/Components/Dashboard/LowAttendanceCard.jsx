import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { fetchAttendanceDetail } from "../../services/dailySubjectAttendance";
import { normalizeCourseCode } from "../../utils/courseSubjects";
import { LOW_ATTENDANCE, studentAttendance } from "../../utils/kendraReport";
import { downloadTableXlsx } from "../../utils/exportTable";

const WINDOW_DAYS = 30;
const SHOWN = 8;

const isoDate = (date) => date.toISOString().slice(0, 10);

// Last 30 days, ending today.
const lastDays = () => {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (WINDOW_DAYS - 1));
  return { from: isoDate(from), to: isoDate(to) };
};

const tone = (pct) => (pct < 50 ? "bg-red-50 text-red-700 ring-red-200" : "bg-amber-50 text-amber-700 ring-amber-200");

/**
 * Students whose attendance over the last 30 days is below LOW_ATTENDANCE,
 * worst first, using the same calculation as the Kendra Report.
 */
export function LowAttendanceCard({ students = [], portalName, loadingStudents = false }) {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [range] = useState(lastDays);

  useEffect(() => {
    let active = true;
    fetchAttendanceDetail({ from: range.from, to: range.to, centre: portalName })
      .then((rows) => active && setRecords(rows))
      .catch(() => active && setError("Attendance could not be loaded right now."));
    return () => {
      active = false;
    };
  }, [portalName, range]);

  const low = useMemo(() => {
    if (!records) return [];
    const withCourse = students.map((s) => ({ ...s, courseCode: normalizeCourseCode(s.course) }));
    return studentAttendance(withCourse, records, range)
      .filter((a) => a.percentage != null && a.percentage < LOW_ATTENDANCE)
      .sort((a, b) => a.percentage - b.percentage || b.longestAbsence - a.longestAbsence);
  }, [records, students, range]);

  const loading = loadingStudents || (records == null && !error);

  const download = () =>
    downloadTableXlsx({
      filename: `low-attendance-${range.to}`,
      sheetName: "Low attendance",
      headers: ["Student ID", "Name", "Course", "Attendance %", "Days present", "Class days", "Longest absence (days)", "Phone", "Father's phone"],
      rows: low.map(({ student, percentage, presentDays, totalDays, longestAbsence }) => [
        student.studentId || "",
        student.name || "",
        student.course || "",
        percentage,
        presentDays,
        totalDays,
        longestAbsence,
        student.phone || "",
        student.parents?.fatherPhone || "",
      ]),
    });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Low attendance</h2>
            <p className="text-sm text-slate-500">
              Students below {LOW_ATTENDANCE}% in the last {WINDOW_DAYS} days, lowest first.
            </p>
          </div>
        </div>
        {low.length ? (
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Download size={15} />
            Download list ({low.length})
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-500">Checking attendance…</p>
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : low.length === 0 ? (
          <p className="flex items-center justify-center gap-2 py-6 text-sm text-emerald-700">
            <CheckCircle2 size={16} />
            No student is below {LOW_ATTENDANCE}% in the last {WINDOW_DAYS} days.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {low.slice(0, SHOWN).map(({ student, percentage, presentDays, totalDays, longestAbsence }) => (
              <li key={student.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{student.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    <span className="font-mono">{student.studentId || "—"}</span> · {student.course || "—"} · present{" "}
                    {presentDays} of {totalDays} days
                    {longestAbsence >= 3 ? ` · absent ${longestAbsence} days in a row` : ""}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ring-inset ${tone(percentage)}`}>
                  {percentage}%
                </span>
              </li>
            ))}
          </ul>
        )}
        {low.length > SHOWN ? (
          <p className="mt-2 text-xs text-slate-500">
            Showing {SHOWN} of {low.length}. Download the list to see everyone.
          </p>
        ) : null}
      </div>
    </section>
  );
}
