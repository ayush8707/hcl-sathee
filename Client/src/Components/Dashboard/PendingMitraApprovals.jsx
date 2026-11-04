import { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { fetchMitraAttendanceRange } from "../../services/mitraAttendance";
import { matchesPortalCentre } from "../../utils/portalMapping";

const WINDOW_MS = 24 * 60 * 60 * 1000;

const isoDate = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatLeft = (ms) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
};

/**
 * Admin reminder: SATHEE MITRA check-ins at this centre that still need
 * approval. They can only be approved within 24 hours of arrival.
 */
export function PendingMitraApprovals({ portalName, onReview }) {
  const [pending, setPending] = useState(null);

  useEffect(() => {
    let active = true;
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    fetchMitraAttendanceRange(isoDate(yesterday), isoDate(now))
      .then((records) => {
        if (!active) return;
        const checkedAt = Date.now();
        const open = records
          .filter((r) => matchesPortalCentre(r.centre, portalName))
          .filter((r) => r.arrivalTime && !r.approved)
          .map((r) => ({ ...r, msLeft: WINDOW_MS - (checkedAt - new Date(r.arrivalTime).getTime()) }))
          .filter((r) => r.msLeft > 0)
          .sort((a, b) => a.msLeft - b.msLeft);
        setPending(open);
      })
      .catch(() => active && setPending([]));
    return () => {
      active = false;
    };
  }, [portalName]);

  if (!pending?.length) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Clock size={20} />
        </span>
        <div>
          <p className="text-base font-semibold text-amber-900">
            {pending.length} SATHEE MITRA check-in{pending.length === 1 ? "" : "s"} waiting for approval
          </p>
          <p className="text-sm text-amber-800">
            {pending.map((r) => r.name || "SATHEE MITRA").slice(0, 3).join(", ")}
            {pending.length > 3 ? ` and ${pending.length - 3} more` : ""}. The first expires in{" "}
            <b>{formatLeft(pending[0].msLeft)}</b>.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReview}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
      >
        Review now
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
