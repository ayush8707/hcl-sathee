import { Check, Clock, X } from "lucide-react";

const STYLES = {
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: Check },
  absent: { label: "Didn't come", className: "bg-slate-100 text-slate-600 ring-slate-200", Icon: X },
  pending: { label: "Waiting for admin", className: "bg-amber-50 text-amber-700 ring-amber-200", Icon: Clock },
};

/** Status chip for one SATHEE Vishist visit. */
export function VishistStatus({ status }) {
  const { label, className, Icon } = STYLES[status] || STYLES.pending;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}
