import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Megaphone,
  MessageSquareText,
  UserPlus,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LOW_ATTENDANCE, LOW_SCORE } from "../../utils/kendraReport";

const fmtPct = (value) => (value == null ? "—" : `${value}%`);
const studentCode = (student) => student.studentId || student.enrollmentNo || student.id;

export function SectionTitle({ number, children, hint }) {
  return (
    <div className="border-b-2 border-slate-200 pb-2">
      <h3 className="text-lg font-bold text-slate-900">
        {number ? `${number}. ` : ""}
        {children}
      </h3>
      {hint ? <p className="mt-0.5 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

function Delta({ value, previous, unit = "%", prevLabel }) {
  if (value == null || previous == null) return null;
  const diff = Math.round((value - previous) * 10) / 10;
  if (diff === 0) return <span className="text-xs text-slate-500">Same as {prevLabel}</span>;
  const up = diff > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon size={13} />
      {up ? "+" : ""}
      {diff}
      {unit} vs {prevLabel}
    </span>
  );
}

function Tile({ icon: Icon, tone, label, value, footer }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={18} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <div className="mt-1 min-h-[16px]">{footer}</div>
    </div>
  );
}

export function SummarySection({ summary, number }) {
  return (
    <section className="mt-8">
      <SectionTitle number={number}>Summary</SectionTitle>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tile icon={Users} tone="bg-blue-100 text-blue-600" label="Students" value={summary.students} footer={<span className="text-xs text-slate-500">In the selected courses</span>} />
        <Tile icon={UserPlus} tone="bg-violet-100 text-violet-600" label="New admissions" value={summary.newAdmissions} footer={<span className="text-xs text-slate-500">Joined in this period</span>} />
        <Tile
          icon={CalendarCheck}
          tone="bg-emerald-100 text-emerald-600"
          label="Avg attendance"
          value={fmtPct(summary.avgAttendance)}
          footer={summary.avgAttendance == null ? <span className="text-xs text-slate-500">Not taken yet</span> : <Delta value={summary.avgAttendance} previous={summary.prevAttendance} unit=" pts" prevLabel={summary.prevLabel} />}
        />
        <Tile
          icon={GraduationCap}
          tone="bg-sky-100 text-sky-600"
          label="Avg test score"
          value={fmtPct(summary.avgScore)}
          footer={summary.avgScore == null ? <span className="text-xs text-slate-500">No marks yet</span> : <Delta value={summary.avgScore} previous={summary.prevScore} unit=" pts" prevLabel={summary.prevLabel} />}
        />
        <Tile
          icon={ClipboardList}
          tone="bg-amber-100 text-amber-600"
          label="Tests held"
          value={summary.testsHeld}
          footer={<Delta value={summary.testsHeld} previous={summary.prevTestsHeld} unit="" prevLabel={summary.prevLabel} />}
        />
        <Tile
          icon={AlertTriangle}
          tone="bg-rose-100 text-rose-600"
          label="Students at risk"
          value={summary.atRisk}
          footer={<span className="text-xs text-slate-500">Attendance &lt; {LOW_ATTENDANCE}% or score &lt; {LOW_SCORE}%</span>}
        />
      </div>
    </section>
  );
}

function SimpleTable({ head, rows, empty, align = [] }) {
  if (!rows.length) return <p className="mt-2 text-sm text-slate-400">{empty}</p>;
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            {head.map((h, i) => (
              <th key={h} className={`border-b border-slate-200 px-3 py-2 font-semibold text-slate-600 ${align[i] === "right" ? "text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="odd:bg-white even:bg-slate-50">
              {row.map((cell, i) => (
                <td key={i} className={`border-b border-slate-100 px-3 py-2 text-slate-700 ${align[i] === "right" ? "text-right tabular-nums" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bands({ bands }) {
  const total = bands.high + bands.mid + bands.low + bands.none;
  const items = [
    { key: "high", label: "90% or more", tone: "bg-emerald-500" },
    { key: "mid", label: `${LOW_ATTENDANCE}–89%`, tone: "bg-blue-500" },
    { key: "low", label: `Below ${LOW_ATTENDANCE}%`, tone: "bg-rose-500" },
    { key: "none", label: "No attendance taken", tone: "bg-slate-300" },
  ];
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {items.map(({ key, tone }) =>
          bands[key] ? <div key={key} className={tone} style={{ width: `${(bands[key] / Math.max(total, 1)) * 100}%` }} /> : null
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map(({ key, label, tone }) => (
          <div key={key} className="flex items-center gap-2 text-sm text-slate-600">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone}`} />
            <span>
              {label}: <strong className="text-slate-900">{bands[key]}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EngagementSection({ overview, number }) {
  return (
    <section className="mt-10">
      <SectionTitle number={number} hint="How regularly students attend and how they are scoring in this period.">
        Student engagement
      </SectionTitle>

      <p className="mt-5 text-sm font-semibold text-slate-700">Attendance spread</p>
      <Bands bands={overview.bands} />

      <p className="mt-6 text-sm font-semibold text-slate-700">Students needing attention</p>
      <SimpleTable
        head={["Student", "ID", "Course", "Reason"]}
        rows={overview.atRisk.map((r) => [r.student.name, studentCode(r.student), r.student.courseCode, r.reasons.join(" · ")])}
        empty="No students below the attendance or score thresholds."
      />

      <p className="mt-6 text-sm font-semibold text-slate-700">Low attendance and absence streaks</p>
      <SimpleTable
        head={["Student", "Course", "Attendance", "Days present", "Longest absence"]}
        align={[null, null, "right", "right", "right"]}
        rows={overview.lowAttendance.map((a) => [
          a.student.name,
          a.student.courseCode,
          `${a.percentage}%`,
          `${a.presentDays} / ${a.totalDays}`,
          `${a.longestAbsence} day${a.longestAbsence === 1 ? "" : "s"}`,
        ])}
        empty={`Everyone with attendance records is at ${LOW_ATTENDANCE}% or above.`}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-700">Top 5 students</p>
          <SimpleTable
            head={["Student", "Course", "Avg score"]}
            align={[null, null, "right"]}
            rows={overview.topStudents.map((s) => [s.student.name, s.student.courseCode, `${s.score}%`])}
            empty="No marks recorded in this period."
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Bottom 5 students</p>
          <SimpleTable
            head={["Student", "Course", "Avg score"]}
            align={[null, null, "right"]}
            rows={overview.bottomStudents.map((s) => [s.student.name, s.student.courseCode, `${s.score}%`])}
            empty="Shown once more than 5 students have marks."
          />
        </div>
      </div>

      <p className="mt-6 text-sm font-semibold text-slate-700">Subject-wise average marks</p>
      <SimpleTable
        head={["Subject", "Marks entered", "Average"]}
        align={[null, "right", "right"]}
        rows={overview.subjectAverages.map((s) => [s.subject, s.entries, `${s.average}%`])}
        empty="No marks recorded in this period."
      />
    </section>
  );
}

function Stat({ icon: Icon, label, value, detail }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        {detail ? <p className="text-xs text-slate-500">{detail}</p> : null}
      </div>
    </div>
  );
}

export function ActivitySection({ activity, unavailable, number }) {
  return (
    <section className="mt-10">
      <SectionTitle number={number} hint="Work done by Sathee Mitras and Vishists, and centre activity in this period.">
        Mentors &amp; centre activity
      </SectionTitle>

      {unavailable.length ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Could not load: {unavailable.join(", ")}. Those figures show as 0.
        </p>
      ) : null}

      <p className="mt-5 text-sm font-semibold text-slate-700">Mentors</p>
      <SimpleTable
        head={["Name", "Role", "Days present", "Sessions taught", "Subjects"]}
        align={[null, null, "right", "right", null]}
        rows={activity.mentorRows.map((m) => [
          m.name,
          m.type,
          m.daysPresent,
          m.type === "Vishist" ? m.sessions : "—",
          m.subjects.length ? m.subjects.join(", ") : "—",
        ])}
        empty="No Sathee Mitra or Vishist accounts in this centre."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={BookOpenCheck} label="Vishist sessions" value={activity.vishistSessions} />
        <Stat
          icon={CalendarCheck}
          label="Leave requests"
          value={activity.leaves.total}
          detail={`${activity.leaves.approved} approved · ${activity.leaves.rejected} rejected · ${activity.leaves.pending} pending`}
        />
        <Stat
          icon={MessageSquareText}
          label="Queries raised"
          value={activity.queries.total}
          detail={`${activity.queries.replied} replied · ${activity.queries.open} open`}
        />
        <Stat icon={Megaphone} label="Announcements" value={activity.announcements.total} detail="Posted for this centre" />
      </div>

      {activity.announcements.latest.length ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest announcements</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {activity.announcements.latest.map((title, i) => (
              <li key={i}>{title}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function YearOverviewSection({ trend, perStudent, number, courses }) {
  const hasData = trend.some((m) => m.attendance != null || m.score != null);
  return (
    <section className="mt-10">
      <SectionTitle number={number} hint="Month-by-month attendance and average test score.">
        Year overview
      </SectionTitle>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        {hasData ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${v}%`} width={36} />
                <Tooltip formatter={(value, name) => [value == null ? "—" : `${value}%`, name]} />
                <Legend />
                <Line type="monotone" dataKey="attendance" name="Attendance" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="score" name="Avg test score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No attendance or marks recorded in this period yet.</p>
        )}
      </div>

      <SimpleTable
        head={["Month", "Attendance", "Avg test score"]}
        align={[null, "right", "right"]}
        rows={trend.map((m) => [m.label, fmtPct(m.attendance), fmtPct(m.score)])}
        empty="No months in this period yet."
      />

      {courses.map((course) => {
        const rows = perStudent.filter((p) => p.student.courseCode === course);
        return (
          <div key={course} className="mt-6">
            <h4 className="text-base font-semibold text-blue-700">{course}</h4>
            <SimpleTable
              head={["Student", "ID", "Attendance", "Avg score", "Tests taken"]}
              align={[null, null, "right", "right", "right"]}
              rows={rows.map((p) => [p.student.name, studentCode(p.student), fmtPct(p.attendance), fmtPct(p.score), p.tests])}
              empty="No students in this course."
            />
          </div>
        );
      })}
    </section>
  );
}
