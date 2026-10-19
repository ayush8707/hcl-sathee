import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { subscribeToPush, unsubscribeFromPush } from "../../utils/webPush";
import { registerPushSubscription, unregisterPushSubscription } from "../../services/notifications";

const PREF_KEY = "sathee_notifications_pref";
const DISMISS_KEY = "sathee_notifications_banner_hidden";

const readStoredValue = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStoredValue = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

const readStoredPref = () => readStoredValue(PREF_KEY);
const writeStoredPref = (value) => writeStoredValue(PREF_KEY, value);

export function NotificationSettingsBanner({
  message = "Get notified about announcements, leave requests, and query replies.",
}) {
  const [enabled, setEnabled] = useState(() => {
    const stored = readStoredPref();
    if (stored === "yes") return true;
    if (stored === "no") return false;
    return typeof Notification !== "undefined" && Notification.permission === "granted";
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [hidden, setHidden] = useState(() => {
    if (readStoredValue(DISMISS_KEY) === "yes") return true;
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "yes";
    } catch {
      return false;
    }
  });

  // Keep the server-side subscription fresh on every visit, unless the user
  // has explicitly opted out.
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted" && readStoredPref() !== "no") {
      subscribeToPush()
        .then((subscription) => subscription && registerPushSubscription(subscription))
        .catch(() => {});
    }
  }, []);

  const setNotifications = async (turnOn) => {
    setSaving(true);
    setStatus(null);

    if (typeof Notification === "undefined") {
      setStatus({ type: "error", text: "Notifications aren't supported in this browser." });
      setSaving(false);
      return;
    }

    if (turnOn) {
      try {
        const subscription = await subscribeToPush();
        if (subscription) {
          await registerPushSubscription(subscription);
          writeStoredPref("yes");
          setEnabled(true);
          setStatus({ type: "success", text: "Notifications are on." });
        } else if (Notification.permission === "denied") {
          setStatus({
            type: "error",
            text: "Your browser is blocking notifications for this site. Allow notifications in your browser's site settings, then try again.",
          });
        } else {
          setStatus({ type: "error", text: "Couldn't enable notifications. Please try again." });
        }
      } catch {
        setStatus({ type: "error", text: "Couldn't enable notifications. Please try again." });
      }
    } else {
      try {
        const subscription = await unsubscribeFromPush();
        if (subscription) await unregisterPushSubscription(subscription);
      } finally {
        writeStoredPref("no");
        setEnabled(false);
        setStatus({ type: "success", text: "Notifications are off." });
      }
    }

    setSaving(false);
  };

  // With notifications on there is nothing left to do, so hide for good;
  // otherwise hide until the next login so the option is not lost.
  const hide = () => {
    if (enabled) {
      writeStoredValue(DISMISS_KEY, "yes");
    } else {
      try {
        sessionStorage.setItem(DISMISS_KEY, "yes");
      } catch {
        // ignore storage errors
      }
    }
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div className="relative rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 pr-12 text-blue-900">
      <button
        type="button"
        onClick={hide}
        className="absolute right-3 top-3 rounded-full p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
        aria-label="Hide this message"
        title="Hide"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {enabled ? (
            <Bell size={18} className="mt-0.5 shrink-0" />
          ) : (
            <BellOff size={18} className="mt-0.5 shrink-0" />
          )}
          <p className="text-sm">
            {enabled ? "Notifications are on. " : ""}
            {message}
          </p>
        </div>

        {enabled ? (
          <button
            type="button"
            onClick={() => setNotifications(false)}
            disabled={saving}
            className="shrink-0 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            {saving ? "Please wait..." : "Turn off"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setNotifications(true)}
            disabled={saving}
            className="shrink-0 rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60"
          >
            {saving ? "Please wait..." : "Turn on notifications"}
          </button>
        )}
      </div>

      {status && (
        <p
          className={`mt-2 text-xs ${
            status.type === "error" ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
