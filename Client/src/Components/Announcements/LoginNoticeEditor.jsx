import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { fetchLoginNotice, saveLoginNotice } from "../../services/siteNotice";
import { getApiErrorMessage } from "../../utils/apiRequest";

const MAX_LENGTH = 300;

// Admin control for the short notice shown on the login page.
export default function LoginNoticeEditor() {
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState("info");
  const [savedMessage, setSavedMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let active = true;
    fetchLoginNotice()
      .then((notice) => {
        if (!active) return;
        setMessage(notice?.message || "");
        setLevel(notice?.level || "info");
        setSavedMessage(notice?.message || "");
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const save = async (nextMessage) => {
    setSaving(true);
    setStatus(null);
    try {
      const notice = await saveLoginNotice({ message: nextMessage, level });
      setMessage(notice?.message || "");
      setSavedMessage(notice?.message || "");
      setStatus({ type: "success", text: notice ? "Notice is showing on the login page." : "Notice removed from the login page." });
    } catch (err) {
      setStatus({ type: "error", text: getApiErrorMessage(err, "Could not save the notice.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <LogIn size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">Login page notice</h2>
          <p className="text-sm text-slate-500">
            A short message everyone sees on the sign-in page, e.g. planned maintenance. Leave empty to show
            nothing.
          </p>
        </div>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
        disabled={loading || saving}
        rows={2}
        placeholder={loading ? "Loading…" : "e.g. The portal will be unavailable on Sunday from 10 to 11 am."}
        className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:opacity-60"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            Type
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              disabled={loading || saving}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              <option value="info">Information (blue)</option>
              <option value="warning">Important (amber)</option>
            </select>
          </label>
          <span className="text-xs text-slate-400">
            {message.length}/{MAX_LENGTH}
          </span>
        </div>

        <div className="flex gap-2">
          {savedMessage ? (
            <button
              type="button"
              onClick={() => save("")}
              disabled={saving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              Remove notice
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => save(message)}
            disabled={loading || saving || !message.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save notice"}
          </button>
        </div>
      </div>

      {status ? (
        <p className={`mt-2 text-xs ${status.type === "error" ? "text-red-600" : "text-emerald-700"}`}>{status.text}</p>
      ) : null}
    </section>
  );
}
