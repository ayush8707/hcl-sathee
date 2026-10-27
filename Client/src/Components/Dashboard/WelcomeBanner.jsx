import { Clock, MapPin } from "lucide-react";
import { getSession } from "../../utils/authSession";
import { getCentreId, getCentrePlace } from "../../utils/centreDirectory";
import { getPortalPartner } from "../../config/csrPartners";

const formatLogin = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export function WelcomeBanner({ portalName, userName }) {
  // Set by the server at login: an ISO time, null on the first login, or
  // undefined when the server could not report it (line hidden).
  const lastLoginAt = getSession()?.lastLoginAt;
  const formattedLastLogin =
    lastLoginAt === undefined ? null : lastLoginAt ? formatLogin(lastLoginAt) : "This is your first login";

  // Kendra details; centres added from the State Portals page have none yet.
  const kendraId = getCentreId(portalName);
  const place = getCentrePlace(portalName);
  const partner = kendraId ? getPortalPartner(portalName) : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[#3B82F6]" />

      <div className="relative flex flex-col items-start justify-between gap-4 px-6 py-6 sm:px-8 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-3">
            <span className="text-3xl">👋</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Welcome Back, {userName || "Administrator"}
            </h1>
          </div>

          <p className="text-base font-medium text-slate-600">
            {portalName ? `${portalName} Portal` : "HCL SATHEE Portal"}
          </p>

          {kendraId ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                {kendraId}
              </span>
              {place ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  {place}
                </span>
              ) : null}
              {partner ? (
                <span className="inline-flex items-center gap-2">
                  <span className="text-slate-500">Supported by</span>
                  {partner.logo ? (
                    <img src={partner.logo} alt="" className="h-6 w-auto max-w-[72px] rounded bg-white object-contain" />
                  ) : null}
                  <span className="font-medium text-slate-700">{partner.name}</span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {formattedLastLogin ? (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock size={16} />
              <span>Last login: {formattedLastLogin}</span>
            </div>
          ) : null}

          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
