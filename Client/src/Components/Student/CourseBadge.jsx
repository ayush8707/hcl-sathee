import { courseTone } from "../../utils/courseStyles";

export default function CourseBadge({ course }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${courseTone(course)}`}>
      {course || "—"}
    </span>
  );
}
