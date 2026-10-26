import { useEffect, useState } from "react";
import { ArrowRight, Building2, CalendarDays, CalendarRange, CalendarClock, UserRound, UsersRound, BadgeCheck } from "lucide-react";
import { fetchCentres } from "../../services/centres";

const DEFAULT_CENTRE_OPTIONS = [
  "HCL RAJASTHAN",
  "HCL JHARKHAND",
  "HCL MADHYA PRADESH",
  "HCL BARMER",
];

const TYPE_OPTIONS = [
  { value: "daily", label: "Daily", icon: CalendarDays },
  { value: "weekly", label: "Weekly", icon: CalendarRange },
  { value: "monthly", label: "Monthly", icon: CalendarClock },
];

const segmentClass = (active, disabled = false) =>
  `inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
    disabled
      ? "cursor-not-allowed text-slate-300"
      : active
        ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
        : "text-slate-600 hover:text-slate-900"
  }`;

const pillClass = (active) =>
  `px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${active
    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
    : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
  }`;

function FilterLabel({ step, children }) {
  return (
    <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-600">
        {step}
      </span>
      {children}
    </p>
  );
}

export default function TabSelector({
  activeTab,
  setActiveTab,
  selectedCentre = "",
  setSelectedCentre,
  selectedRole = "",
  setSelectedRole,
  showCentreFilter = false,
  showMitraTab = true,
  mitraTabLabel = "SATHEE MITRA",
  onGo,
  canGo = false,
}) {
  const [centreOptions, setCentreOptions] = useState(DEFAULT_CENTRE_OPTIONS);

  useEffect(() => {
    if (!showCentreFilter) return undefined;
    let cancelled = false;
    fetchCentres()
      .then((centres) => {
        if (cancelled) return;
        const names = centres.map((c) => c.name).filter(Boolean);
        if (names.length) setCentreOptions(names);
      })
      .catch((error) => console.error("Fetch Centres Error:", error));
    return () => {
      cancelled = true;
    };
  }, [showCentreFilter]);

  const typeValue = TYPE_OPTIONS.some((opt) => opt.value === activeTab)
    ? activeTab
    : "";
  // SATHEE VISHIST only has day-wise attendance.
  const vishistBlocked = typeValue === "weekly" || typeValue === "monthly";

  const roleOptions = [
    { value: "student", label: "Students", icon: UsersRound },
    { value: "sathee-mitra", label: mitraTabLabel, icon: UserRound },
    { value: "sathee-vishist", label: "SATHEE VISHIST", icon: BadgeCheck, disabled: vishistBlocked },
  ];

  const chooseType = (nextType) => {
    setActiveTab(nextType);
    if (nextType === "weekly" || nextType === "monthly") {
      setSelectedRole?.((currentRole) =>
        currentRole === "sathee-vishist" ? "" : currentRole
      );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <FilterLabel step={1}>Period</FilterLabel>
          <div role="radiogroup" aria-label="Select attendance type" className="flex rounded-lg bg-slate-100 p-1">
            {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={typeValue === value}
                onClick={() => chooseType(value)}
                className={segmentClass(typeValue === value)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {showCentreFilter ? (
          <div className="min-w-0">
            <FilterLabel step={2}>Centre</FilterLabel>
            <div className="relative">
              <Building2
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={selectedCentre}
                onChange={(e) => setSelectedCentre?.(e.target.value)}
                className={`w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-8 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                  selectedCentre ? "text-slate-900" : "text-slate-400"
                }`}
                aria-label="Select centre"
              >
                <option value="">Choose a centre</option>
                {centreOptions.map((centre) => (
                  <option key={centre} value={centre} className="text-slate-900">
                    {centre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <FilterLabel step={showCentreFilter ? 3 : 2}>Attendance of</FilterLabel>
          <div role="radiogroup" aria-label="Select role" className="flex flex-wrap rounded-lg bg-slate-100 p-1 md:flex-nowrap">
            {roleOptions.map(({ value, label, icon: Icon, disabled }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selectedRole === value}
                disabled={disabled}
                title={disabled ? "SATHEE VISHIST attendance is available day-wise only" : undefined}
                onClick={() => setSelectedRole?.(value)}
                className={segmentClass(selectedRole === value, disabled)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {showMitraTab ? (
          <button
            type="button"
            onClick={() => setActiveTab("sathee-mitra")}
            className={pillClass(activeTab === "sathee-mitra")}
          >
            {mitraTabLabel}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onGo}
          disabled={!canGo}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          Show attendance
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
