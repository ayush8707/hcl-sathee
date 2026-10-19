import { useMemo } from "react";
import { SectionHeader } from "./SectionHeader";
import { getCourseExamProgress } from "../../utils/studentMetrics";

export function ExamProgress({ students = [], loading = false }) {
  const examProgress = useMemo(
    () => getCourseExamProgress(students),
    [students]
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col overflow-visible">
      <SectionHeader title="Batch Exam Progress" />

      <div className="space-y-5 mt-4">
        {loading ? (
          <p className="text-sm text-slate-500 py-8 text-center">Loading exam progress…</p>
        ) : (
          examProgress.map((item) => {
            const empty = item.noStudents || item.noMarks;
            return (
            <div key={item.exam}>
              <div className="flex justify-between text-sm mb-2 gap-3">
                <span className="font-medium text-slate-900">{item.exam}</span>
                <span
                  className={`shrink-0 ${empty ? "text-xs font-medium" : "font-semibold"}`}
                  style={{ color: empty ? "#64748B" : item.color }}
                >
                  {item.noStudents ? "No students" : item.noMarks ? "No tests yet" : `${item.progress}%`}
                </span>
              </div>
              <div className="h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${empty ? 0 : item.progress}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
