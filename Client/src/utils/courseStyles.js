export const COURSE_OPTIONS = ["JEE", "NEET", "SSC", "CLAT", "IBPS", "ICAR", "CUET", "RRB"];

// One colour per course so batches are easy to tell apart at a glance.
const COURSE_TONES = {
  JEE: "bg-blue-50 text-blue-700 ring-blue-200",
  NEET: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CUET: "bg-violet-50 text-violet-700 ring-violet-200",
  SSC: "bg-amber-50 text-amber-700 ring-amber-200",
  CLAT: "bg-rose-50 text-rose-700 ring-rose-200",
  IBPS: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  ICAR: "bg-lime-50 text-lime-700 ring-lime-200",
  RRB: "bg-orange-50 text-orange-700 ring-orange-200",
};

export const courseTone = (course) =>
  COURSE_TONES[String(course || "").trim().toUpperCase()] || "bg-slate-50 text-slate-700 ring-slate-200";
