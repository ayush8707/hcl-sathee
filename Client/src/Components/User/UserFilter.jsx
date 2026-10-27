// Colour per role, matching the role tags in the table.
const ROLE_TONES = {
  ADMIN: "bg-blue-50 text-blue-700 ring-blue-200",
  "SATHEE MITRA": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "HCL PARTNER": "bg-purple-50 text-purple-700 ring-purple-200",
};

const UserFilter = ({ filters, activeFilter, setActiveFilter, roleCount, formatRole = (role) => role }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => {
        const active = activeFilter === f;
        const tone = ROLE_TONES[f] || "bg-white text-slate-700 ring-slate-200";
        return (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFilter(f)}
            aria-pressed={active}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition ${
              active ? "bg-blue-600 text-white ring-blue-600 shadow-sm" : `${tone} hover:brightness-95`
            }`}
          >
            {formatRole(f)}
            <span
              className={`rounded-full px-1.5 text-xs font-bold ${
                active ? "bg-white/25 text-white" : "bg-white/70"
              }`}
            >
              {roleCount(f)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default UserFilter;
