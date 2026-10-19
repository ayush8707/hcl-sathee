import { CalendarCheck, CalendarClock, MessageSquareText, Users } from "lucide-react";

function Tile({ icon: Icon, label, value, hint, tone, onClick }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex min-w-0 flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${
        onClick ? "transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md" : ""
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="truncate text-xs text-slate-500">{hint}</p> : null}
      </div>
    </Wrapper>
  );
}

const show = (value, loading) => (loading || value == null ? "—" : value.toLocaleString("en-IN"));

// Headline numbers shown under the welcome banner. A tile is hidden when its
// value is `undefined` (the role cannot see that data).
export function StatTiles({
  totalStudents,
  loadingStudents,
  todayAttendance,
  pendingLeaves,
  openQueries,
  onStudents,
  onAttendance,
  onLeaves,
  onQueries,
}) {
  const todayHint =
    todayAttendance === undefined
      ? null
      : todayAttendance === null
        ? "Not available"
        : todayAttendance.presentCount === 0
          ? "Not marked yet today"
          : `${todayAttendance.presentCount} of ${todayAttendance.totalStudents} present`;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Tile
        icon={Users}
        label="Total Students"
        value={show(totalStudents, loadingStudents)}
        hint="In this centre"
        tone="bg-blue-100 text-blue-600"
        onClick={onStudents}
      />
      {todayAttendance !== undefined ? (
        <Tile
          icon={CalendarCheck}
          label="Today's Attendance"
          value={todayAttendance && todayAttendance.presentCount > 0 ? `${Number(todayAttendance.percentage) || 0}%` : "—"}
          hint={todayHint}
          tone="bg-emerald-100 text-emerald-600"
          onClick={onAttendance}
        />
      ) : null}
      {pendingLeaves !== undefined ? (
        <Tile
          icon={CalendarClock}
          label="Pending Leaves"
          value={show(pendingLeaves)}
          hint="Waiting for review"
          tone="bg-amber-100 text-amber-600"
          onClick={onLeaves}
        />
      ) : null}
      {openQueries !== undefined ? (
        <Tile
          icon={MessageSquareText}
          label="Open Queries"
          value={show(openQueries)}
          hint="Not replied yet"
          tone="bg-violet-100 text-violet-600"
          onClick={onQueries}
        />
      ) : null}
    </div>
  );
}
