import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { MainLayout } from "../../Components/MainLayout";
import { WelcomeBanner } from "../../Components/Dashboard/WelcomeBanner";
import { NotificationSettingsBanner } from "../../Components/Dashboard/NotificationSettingsBanner";
import { AttendanceChart } from "../../Components/Dashboard/AttendanceChart";
import { StudentsByCourseChart } from "../../Components/Dashboard/StudentsByCourseChart";
import { QuickActions } from "../../Components/Dashboard/QuickActions";
import { ExamProgress } from "../../Components/Dashboard/ExamProgress";
import { StatTiles } from "../../Components/Dashboard/StatTiles";
import { LowAttendanceCard } from "../../Components/Dashboard/LowAttendanceCard";
import { fetchStudentPerformance } from "../../services/studentPerformance";
import { fetchAttendanceSummary } from "../../services/dailySubjectAttendance";
import { fetchLeaveRequests } from "../../services/leaveRequests";
import { fetchSupportQueries } from "../../services/supportQueries";
import { getCentreValueFromPortal, matchesPortalCentre } from "../../utils/portalMapping";

export default function AdminDashboard({
  portalName,
  userName,
  navItems,
  activeNav,
  onNavChange,
  onLogout,
  readOnly = false,
  roleLabel = "Admin Portal",
  studentsNavIndex = 4,
  attendanceNavIndex = 1,
  isCustomCentre = false,
  variant = "admin",
  usersNavIndex = 3,
  announcementsNavIndex = 5,
  queriesNavIndex = 6,
  notificationMessage = "Get notified about Attendance, Leave Requests, and Queries.",
}) {
  const [students, setStudents] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [todaySummary, setTodaySummary] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(null);
  const [openQueries, setOpenQueries] = useState(null);
  const navigate = useNavigate();
  const isAdmin = variant === "admin";
  // Attendance summary is served to admins and partners only.
  const canSeeAttendance = variant !== "mitra";

  useEffect(() => {
    let isMounted = true;

    // Skip data fetching for custom centres
    if (isCustomCentre) {
      setStudents([]);
      setLoadingStats(false);
      return;
    }

    const loadStats = async () => {
      setLoadingStats(true);
      setStatsError("");

      try {
        const data = await fetchStudentPerformance();
        if (!isMounted) return;
        setStudents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Dashboard stats error:", error);
        if (!isMounted) return;
        setStatsError("Unable to load dashboard stats");
        setStudents([]);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [isCustomCentre]);

  useEffect(() => {
    let isMounted = true;

    // Skip data fetching for custom centres
    if (isCustomCentre || !canSeeAttendance) {
      setTodaySummary(null);
      return;
    }

    const centre = getCentreValueFromPortal(portalName) || portalName || null;
    fetchAttendanceSummary({ period: "daily", centre })
      .then((data) => isMounted && setTodaySummary(data))
      .catch(() => isMounted && setTodaySummary(null));
    return () => {
      isMounted = false;
    };
  }, [portalName, isCustomCentre, canSeeAttendance]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let isMounted = true;

    fetchLeaveRequests()
      .then((leaves) => {
        if (!isMounted) return;
        const centreLeaves = isCustomCentre
          ? []
          : leaves.filter((leave) => matchesPortalCentre(leave.centre, portalName));
        setPendingLeaves(
          centreLeaves.filter((leave) => String(leave.status || "pending").toLowerCase() === "pending").length
        );
      })
      .catch(() => isMounted && setPendingLeaves(null));

    fetchSupportQueries(getCentreValueFromPortal(portalName))
      .then((queries) => {
        if (!isMounted) return;
        setOpenQueries(queries.filter((query) => (query.status || "Open") !== "Replied").length);
      })
      .catch(() => isMounted && setOpenQueries(null));

    return () => {
      isMounted = false;
    };
  }, [isAdmin, isCustomCentre, portalName]);

  const stats = useMemo(() => {
    const centreStudents = students.filter((student) =>
      matchesPortalCentre(student.centre, portalName)
    );

    return {
      centreStudents,
    };
  }, [students, portalName]);

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      roleLabel={roleLabel}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <NotificationSettingsBanner message={notificationMessage} />

        <WelcomeBanner portalName={portalName} userName={userName} />

        <StatTiles
          totalStudents={stats.centreStudents.length}
          loadingStudents={loadingStats}
          todayAttendance={canSeeAttendance ? todaySummary : undefined}
          pendingLeaves={isAdmin ? pendingLeaves : undefined}
          openQueries={isAdmin ? openQueries : undefined}
          onStudents={() => onNavChange(studentsNavIndex)}
          onAttendance={() => onNavChange(attendanceNavIndex)}
          onLeaves={() => navigate("/leave-requests")}
          onQueries={() => onNavChange(queriesNavIndex)}
        />

        <QuickActions
          readOnly={readOnly}
          onAddUser={isAdmin ? () => onNavChange(usersNavIndex) : undefined}
          onPostAnnouncement={isAdmin ? () => onNavChange(announcementsNavIndex) : undefined}
          portalName={portalName}
          isCustomCentre={isCustomCentre}
          onViewStudents={() => onNavChange(studentsNavIndex)}
          onViewAttendance={() => onNavChange(attendanceNavIndex)}
        />

        {statsError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {statsError}
          </div>
        )}

        {!isCustomCentre ? (
          <LowAttendanceCard
            students={stats.centreStudents}
            portalName={portalName}
            loadingStudents={loadingStats}
          />
        ) : null}

        <StudentsByCourseChart students={stats.centreStudents} loading={loadingStats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceChart portalName={portalName} isCustomCentre={isCustomCentre} />
          <ExamProgress students={stats.centreStudents} loading={loadingStats} />
        </div>

        <div className="h-8" />
      </div>
    </MainLayout>
  );
}