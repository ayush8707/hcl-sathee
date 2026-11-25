import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Lock, LogOut, MapPin, Search, ShieldAlert } from "lucide-react";
import SatheeLogo from "../../assets/sathee.svg";
import { fetchCentres } from "../../services/centres";
import { canAccessPortal } from "../../utils/portalMapping";
import { buildKendraDirectory, groupByState, OTHER_STATE } from "../../utils/kendraDirectory";
import { openSatheeApp } from "../../config/satheeApp";

const ALL = "All states";

function KendraCard({ kendra, allowed, onOpen }) {
  return (
    <article
      className={`flex min-w-0 flex-col rounded-2xl border bg-white shadow-sm transition duration-200 ${
        allowed ? "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md" : "border-slate-200 bg-slate-50/70"
      }`}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1 ${
              allowed ? "" : "opacity-60 grayscale"
            }`}
          >
            {kendra.partnerLogo ? (
              <img src={kendra.partnerLogo} alt={kendra.partnerName} className="h-full w-full object-contain" />
            ) : (
              <MapPin size={22} className="text-blue-600" />
            )}
          </div>
          {kendra.kendraId ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
              {kendra.kendraId}
            </span>
          ) : null}
        </div>
        <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{kendra.name}</h3>
        {kendra.place ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin size={14} className="shrink-0 text-slate-400" />
            {kendra.place}
          </p>
        ) : null}
        <p className="mt-1 text-xs font-medium text-slate-500">
          Supported by <span className="text-slate-700">{kendra.partnerName}</span>
        </p>
      </div>
      <div className="border-t border-slate-100 px-5 py-3">
        {allowed ? (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            Open Kendra
            <ArrowRight size={16} />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <Lock size={15} />
            No access
          </span>
        )}
      </div>
    </article>
  );
}

/** Every SATHEE Kendra, grouped by state. Users can open the ones they have access to. */
export default function SatheeKendras({ openPortal, onBack, onLogout, userRole, userCentre }) {
  const [added, setAdded] = useState([]);
  const [stateFilter, setStateFilter] = useState(ALL);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetchCentres()
      .then((centres) => active && setAdded(centres))
      .catch(() => {}); // built-in Kendras still show without this list
    return () => {
      active = false;
    };
  }, []);

  const kendras = useMemo(() => buildKendraDirectory(added), [added]);
  const states = useMemo(() => [...new Set(groupByState(kendras).map((g) => g.state))], [kendras]);
  const stateCount = states.filter((s) => s !== OTHER_STATE).length;
  const partners = useMemo(() => new Set(kendras.map((k) => k.partnerName)).size, [kendras]);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const shown = kendras.filter(
      (k) =>
        (stateFilter === ALL || k.state === stateFilter) &&
        (!q || [k.name, k.place, k.state, k.partnerName, k.kendraId].some((v) => String(v || "").toLowerCase().includes(q)))
    );
    return groupByState(shown);
  }, [kendras, stateFilter, search]);

  const open = (title) => {
    if (!canAccessPortal(userCentre, title, userRole)) {
      setMessage("You don't have access to this Kendra. Ask your admin if you need it.");
      return;
    }
    openPortal?.(title);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F1F5F9] font-sans text-black">
      <header className="h-16 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-[#3B82F6]/20 bg-[#5785d0]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src={SatheeLogo} alt="SATHEE Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold tracking-tight text-black truncate text-sm sm:text-base">SATHEE</p>
            <p className="text-xs text-[#101011] truncate">Kendras</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="bg-white/20 hover:bg-white/30 text-slate-900 px-3 sm:px-5 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Platforms</span>
            </button>
          ) : null}
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white px-3 sm:px-6 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">SATHEE Kendras</h1>
            <p className="mt-2 text-slate-600">
              {kendras.length} Kendras in {stateCount} {stateCount === 1 ? "state" : "states"}, supported by{" "}
              {partners} CSR {partners === 1 ? "partner" : "partners"}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openSatheeApp({ userRole, userCentre })}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Official SATHEE learning portal
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {[ALL, ...states].map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => setStateFilter(state)}
                aria-pressed={stateFilter === state}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition ${
                  stateFilter === state
                    ? "bg-blue-600 text-white ring-blue-600"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Kendra, place, partner…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {message ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm text-red-700">
            <ShieldAlert size={20} className="shrink-0" />
            <p className="font-medium">{message}</p>
          </div>
        ) : null}

        {groups.length === 0 ? (
          <p className="mt-16 text-center text-slate-500">No Kendra matches your search.</p>
        ) : (
          <div className="mt-8 space-y-10">
            {groups.map(({ state, kendras: items }) => (
              <section key={state}>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  {state}
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                    {items.length}
                  </span>
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((kendra) => (
                    <KendraCard
                      key={kendra.title}
                      kendra={kendra}
                      allowed={canAccessPortal(userCentre, kendra.title, userRole)}
                      onOpen={() => open(kendra.title)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
