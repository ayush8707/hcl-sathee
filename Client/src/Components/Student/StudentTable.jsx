import { Mail, Phone, Trash2 } from "lucide-react";
import CourseBadge from "./CourseBadge";
import { AVATAR_COLORS, getInitials } from "../../utils/studentMetrics";

const avatarColor = (student) =>
  student.avatarColor || AVATAR_COLORS[(Number(student.id) || 0) % AVATAR_COLORS.length];

const studentCode = (student) => student.studentId || student.enrollmentNo || student.id;

function Avatar({ student }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ background: avatarColor(student) }}
    >
      {getInitials(student.name || "", "ST")}
    </span>
  );
}

function NameButton({ student, onViewDetails }) {
  return (
    <button
      type="button"
      onClick={() => onViewDetails?.(student)}
      className="flex min-w-0 items-center gap-3 text-left"
    >
      <Avatar student={student} />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-900 group-hover:text-blue-700">{student.name}</span>
        <span className="block font-mono text-xs text-slate-500">{studentCode(student)}</span>
      </span>
    </button>
  );
}

function DeleteButton({ student, onDeleteStudent }) {
  return (
    <button
      type="button"
      onClick={() => onDeleteStudent?.(student)}
      title="Delete student"
      aria-label={`Delete ${student.name}`}
      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 size={17} />
    </button>
  );
}

export default function StudentTable({
  paginated,
  onViewDetails,
  onDeleteStudent,
  readOnly = false,
  serialOffset = 0,
}) {
  if (paginated.length === 0) {
    return <p className="px-6 py-16 text-center text-sm text-slate-500">No students found.</p>;
  }

  return (
    <>
      {/* Computers and tablets: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="w-14 px-5 py-3 text-center">#</th>
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Gender</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Course</th>
              {!readOnly ? <th className="w-20 px-5 py-3 text-center">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {paginated.map((s, i) => (
              <tr key={s.id} className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-blue-50/40">
                <td className="px-5 py-3.5 text-center font-medium tabular-nums text-slate-400">{serialOffset + i + 1}</td>
                <td className="px-5 py-3.5">
                  <NameButton student={s} onViewDetails={onViewDetails} />
                </td>
                <td className="px-5 py-3.5 text-slate-600">{s.gender || "—"}</td>
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Mail size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{s.email || "—"}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-slate-500">
                    <Phone size={13} className="shrink-0 text-slate-400" />
                    {s.phone || "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <CourseBadge course={s.course} />
                </td>
                {!readOnly ? (
                  <td className="px-5 py-3.5 text-center">
                    <DeleteButton student={s} onDeleteStudent={onDeleteStudent} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: one card per student */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {paginated.map((s) => (
          <li key={s.id} className="group flex items-start justify-between gap-3 px-4 py-4">
            <div className="min-w-0 flex-1">
              <NameButton student={s} onViewDetails={onViewDetails} />
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-[52px] text-xs text-slate-500">
                <CourseBadge course={s.course} />
                {s.gender ? <span>{s.gender}</span> : null}
              </div>
              <div className="mt-1.5 space-y-0.5 pl-[52px] text-xs text-slate-600">
                {s.email ? <p className="truncate">{s.email}</p> : null}
                {s.phone ? <p>{s.phone}</p> : null}
              </div>
            </div>
            {!readOnly ? <DeleteButton student={s} onDeleteStudent={onDeleteStudent} /> : null}
          </li>
        ))}
      </ul>
    </>
  );
}
