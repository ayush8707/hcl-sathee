import { useState } from "react";
import { CalendarCheck, CalendarDays, Clock3, GraduationCap, Megaphone, UserPlus } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import Schedule from "../../Pages/Schedule/Schedule";
import TimeTable from "./TimeTable";

export function QuickActions({
  onViewStudents,
  onViewAttendance,
  onAddUser,
  onPostAnnouncement,
  readOnly = false,
  portalName = "",
  isCustomCentre = false,
}) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);

  const quickActions = [
    {
      icon: GraduationCap,
      label: readOnly ? "View Students" : "Add Students",
      tone: "bg-blue-100 text-blue-600",
      onClick: onViewStudents,
    },
    {
      icon: CalendarCheck,
      label: "View Attendance",
      tone: "bg-emerald-100 text-emerald-600",
      onClick: onViewAttendance,
    },
    {
      icon: CalendarDays,
      label: "View Timetable",
      tone: "bg-violet-100 text-violet-600",
      onClick: () => setIsTimetableOpen(true),
    },
    {
      icon: Clock3,
      label: "View Schedule",
      tone: "bg-pink-100 text-pink-600",
      onClick: () => setIsScheduleOpen(true),
    },
    onAddUser && {
      icon: UserPlus,
      label: "Add User",
      tone: "bg-amber-100 text-amber-600",
      onClick: onAddUser,
    },
    onPostAnnouncement && {
      icon: Megaphone,
      label: "Post Announcement",
      tone: "bg-sky-100 text-sky-600",
      onClick: onPostAnnouncement,
    },
  ].filter(Boolean);

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader title="Quick Actions" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="group flex min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${action.tone}`}>
                <action.icon size={22} />
              </div>
              <span className="text-center text-sm font-medium leading-tight text-slate-800">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isScheduleOpen && (
        <Schedule
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          readOnly={readOnly}
          portalName={portalName}
          isCustomCentre={isCustomCentre}
        />
      )}

      {isTimetableOpen && (
        <TimeTable
          isOpen={isTimetableOpen}
          onClose={() => setIsTimetableOpen(false)}
          readOnly={readOnly}
          portalName={portalName}
          isCustomCentre={isCustomCentre}
        />
      )}
    </>
  );
}
