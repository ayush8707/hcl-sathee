import { useState } from "react";
import { Clock } from "lucide-react";

const LAST_LOGIN_KEY = "sathee_last_login";
const SESSION_PREV_KEY = "sathee_prev_login";

const safeGet = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (storage, key, value) => {
  try {
    storage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

// The server does not track logins, so the previous visit is remembered per
// browser: once per session, the stored time moves into the session as
// "previous login" and the current time becomes the new stored value.
const readPreviousLogin = (userName) => {
  if (typeof window === "undefined") return null;
  const key = `${LAST_LOGIN_KEY}:${String(userName || "").trim().toLowerCase()}`;
  const recorded = safeGet(window.sessionStorage, SESSION_PREV_KEY);
  if (recorded !== null) return recorded || null;

  const previous = safeGet(window.localStorage, key) || "";
  safeSet(window.sessionStorage, SESSION_PREV_KEY, previous);
  safeSet(window.localStorage, key, new Date().toISOString());
  return previous || null;
};

export function WelcomeBanner({ portalName, userName }) {
  const [previousLogin] = useState(() => readPreviousLogin(userName));

  const formattedLastLogin = previousLogin
    ? new Date(previousLogin).toLocaleString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "First login on this device";

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
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock size={16} />
            <span>Last login: {formattedLastLogin}</span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
