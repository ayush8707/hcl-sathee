import { Download, Search, UserPlus, FileSpreadsheet } from "lucide-react";
import { COURSE_OPTIONS } from "../../utils/courseStyles";

const controlClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export default function StudentToolbar({
  search,
  onSearch,
  courseFilter,
  onCourseChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  onAddStudent,
  onImportStudents,
  onExport,
  exportCount = 0,
  readOnly = false,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 sm:px-5">
      <div className="relative min-w-[220px] flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search name, student ID, email or phone…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className={`${controlClass} w-full pl-9`}
          aria-label="Search students"
        />
      </div>

      <select
        value={courseFilter}
        onChange={(e) => onCourseChange(e.target.value)}
        className={controlClass}
        aria-label="Filter by course"
      >
        <option>All Courses</option>
        {COURSE_OPTIONS.map((course) => (
          <option key={course}>{course}</option>
        ))}
      </select>

      <select
        value={`${sortBy}:${sortDirection}`}
        onChange={(e) => {
          const [by, direction] = e.target.value.split(":");
          onSortByChange(by);
          onSortDirectionChange(direction);
        }}
        className={controlClass}
        aria-label="Sort students"
      >
        <option value="name:asc">Name (A–Z)</option>
        <option value="name:desc">Name (Z–A)</option>
        <option value="date:desc">Newest first</option>
        <option value="date:asc">Oldest first</option>
      </select>

      <div className="flex items-center gap-2 sm:ml-auto">
        {onExport ? (
          <button
            type="button"
            onClick={onExport}
            disabled={!exportCount}
            title="Download the students shown as an Excel file"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export
          </button>
        ) : null}
      {!readOnly ? (
        <>
          <button
            type="button"
            onClick={onImportStudents}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <FileSpreadsheet size={16} />
            Import
          </button>
          <button
            type="button"
            onClick={onAddStudent}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#3B82F6] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            <UserPlus size={16} />
            Add Student
          </button>
        </>
      ) : null}
      </div>
    </div>
  );
}
