import { useEffect, useRef, useState } from "react";
import { BookOpen, Camera, Check, CheckCircle2, Loader2, X } from "lucide-react";
import { fetchDueVisits, recordVishistVisit } from "../../services/vishistAttendance";
import { getCentreValueFromPortal } from "../../utils/portalMapping";

const niceDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

/**
 * "Did the SATHEE Vishist come?" On a Vishist's visit day (and for up to a
 * week after, until answered) the Kendra's SATHEE MITRA sees one card per
 * visit: one tap for "Didn't come"; "Yes, came" asks for an optional topic
 * and photo. With `showEmpty` it also says when nothing is waiting.
 */
export function VishistDueCard({ portalName, showEmpty = false, onRecorded }) {
  const centre = getCentreValueFromPortal(portalName) || "";
  const [visits, setVisits] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null); // key of the visit being answered "Yes"
  const [topic, setTopic] = useState("");
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchDueVisits(centre)
      .then((rows) => active && setVisits(rows))
      .catch(() => active && setError("Vishist visits could not be loaded right now."));
    return () => {
      active = false;
    };
  }, [centre]);

  const keyOf = (v) => `${v.vishistUserId}|${v.date}`;

  const answer = async (visit, came) => {
    const key = keyOf(visit);
    setSaving(key);
    setError("");
    try {
      await recordVishistVisit({ vishistUserId: visit.vishistUserId, date: visit.date, came, topicTaught: topic, photoFile: photo });
      setVisits((prev) => prev.filter((v) => keyOf(v) !== key));
      setSaved(came ? `${visit.name}'s visit is saved. The admin will approve it.` : `Saved: ${visit.name} didn't come.`);
      setOpen(null);
      setTopic("");
      setPhoto(null);
      onRecorded?.();
    } catch (err) {
      setError(err?.response?.data?.message || "That didn't save. Please try again.");
      // Already answered elsewhere: drop it from the list.
      if (err?.response?.status === 409) setVisits((prev) => prev.filter((v) => keyOf(v) !== key));
    } finally {
      setSaving(null);
    }
  };

  if (visits === null && !error) return null;
  if (!visits?.length && !showEmpty && !saved && !error) return null;

  return (
    <section className="space-y-3">
      {saved ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={16} className="shrink-0" /> {saved}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
      ) : null}
      {showEmpty && visits && !visits.length ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-center text-sm text-slate-500">
          No SATHEE Vishist visits are waiting for an answer. On a Vishist&apos;s visit day, a card will appear here
          and on your dashboard.
        </p>
      ) : null}

      {(visits || []).map((visit) => {
        const key = keyOf(visit);
        const busy = saving === key;
        return (
          <article key={key} className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                <BookOpen size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                  {visit.isToday ? "Today" : niceDate(visit.date)} · SATHEE Vishist visit
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                  Did {visit.name} come{visit.isToday ? " today" : ""}?
                </h3>
                {visit.subject ? <p className="text-sm text-slate-600">{visit.subject}</p> : null}
              </div>
            </div>

            {open === key ? (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Topic taught (optional), e.g. Laws of Motion"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Camera size={16} /> {photo ? "Change photo" : "Add photo (optional)"}
                  </button>
                  {photo ? <span className="max-w-[12rem] truncate text-xs text-slate-500">{photo.name}</span> : null}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setPhoto(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => answer(visit, true)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:flex-none"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setOpen(null);
                      setTopic("");
                      setPhoto(null);
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="button"
                  disabled={busy || saving !== null}
                  onClick={() => {
                    setOpen(key);
                    setTopic("");
                    setPhoto(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Check size={16} /> Yes, came
                </button>
                <button
                  type="button"
                  disabled={busy || saving !== null}
                  onClick={() => answer(visit, false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Didn&apos;t come
                </button>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
