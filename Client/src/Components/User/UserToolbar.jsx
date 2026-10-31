import { Download, Search } from "lucide-react";

const SORT_OPTIONS = [
  { value: "name:asc", label: "Name (A–Z)" },
  { value: "name:desc", label: "Name (Z–A)" },
  { value: "date:desc", label: "Newest first" },
  { value: "date:asc", label: "Oldest first" },
];

export default function UserToolbar({ search, setSearch, sortBy, sortDirection, onSortChange, onExport, exportCount = 0 }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <select
        value={`${sortBy}:${sortDirection}`}
        onChange={(e) => {
          const [nextSortBy, nextDirection] = e.target.value.split(":");
          onSortChange(nextSortBy, nextDirection);
        }}
        aria-label="Sort users"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:w-44"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {onExport ? (
        <button
          type="button"
          onClick={onExport}
          disabled={!exportCount}
          title="Download the users shown as an Excel file"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} />
          Export
        </button>
      ) : null}
    </div>
  );
}
