import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, } from "react-router-dom";
import { LayoutDashboard, CalendarDays, TrendingUp, Users, IdCard, Megaphone, UserCircle, MessageSquareText, ClipboardList, FileBarChart2 } from "lucide-react";

import Authentication from "./Pages/Auth/Authentication";
const CreatePassword = lazy(() => import("./Components/Auth/CreatePassword"));
const ForgetPassword = lazy(() => import("./Components/Auth/ForgetPassword"));
const LegalPage = lazy(() => import("./Pages/Legal/LegalPage"));
const CardSelector_1 = lazy(() => import("./Pages/Selector/CardSelector_1"));
const CardSelector_2 = lazy(() => import("./Pages/Selector/CardSelector_2"));
const OtherCentres = lazy(() => import("./Pages/Selector/OtherCentres"));
const Dashboard = lazy(() => import("./Pages/Dashboard/AdminDashboard"));
const HCLPartnerDashboard = lazy(() => import("./Pages/Dashboard/HCLPartnerDashboard"));
const SatheeMitraDashboard = lazy(() => import("./Pages/Dashboard/SatheeMitraDashboard"));
const AdminAttendance = lazy(() => import("./Pages/Attendance/AdminAttendance"));
const HCLPartnerAttendance = lazy(() => import("./Pages/Attendance/HCLPartnerAttendance"));
const SM_Attendance = lazy(() => import("./Pages/Attendance/SM_Attendance"));
const AdminUser = lazy(() => import("./Pages/User/AdminUser"));
const Student = lazy(() => import("./Pages/Student/Student"));
const PartnerStudents = lazy(() => import("./Pages/Student/View"));
const SM_Student = lazy(() => import("./Pages/Student/SM_Student"));
const AdminAnnouncements = lazy(() => import("./Pages/Announcements/AdminAnnouncements"));
const HCLPartnerAnnouncements = lazy(() => import("./Pages/Announcements/HCLPartnerAnnouncements"));
const SatheeMitraAnnouncements = lazy(() => import("./Pages/Announcements/SatheeMitraAnnouncements"));
const AdminAnalytics = lazy(() => import("./Pages/Analytics/AdminAnalytics"));
const HCLPartnerAnalytics = lazy(() => import("./Pages/Analytics/HCLPartnerAnalytics"));
const SM_Analytics = lazy(() => import("./Pages/Analytics/SM_Analytics"));
const MyProfile = lazy(() => import("./Pages/Profile/MyProfile"));
const AdminLeaveRequests = lazy(() => import("./Pages/Attendance/AdminLeaveRequests"));
const QueryAndSupport = lazy(() => import("./Pages/Support/QueryAndSupport"));
const AdminQueries = lazy(() => import("./Pages/Support/AdminQueries"));
const SM_TestMarks = lazy(() => import("./Pages/TestMarks/SM_TestMarks"));
const CentreReport = lazy(() => import("./Pages/Report/CentreReport"));
import {
  canAccessPortal,
  canOpenPlatform,
  canEnterAdminDashboard,
  canEnterPartnerDashboard,
  canEnterSatheeMitraDashboard,
} from "./utils/portalMapping";
import { clearSession, getSession, setSession, updateSession } from "./utils/authSession";
import { getAuthPayload, getAuthToken } from "./utils/authToken";

const ADMIN_PATH_TO_NAV = {
  "/dashboard": 0,
  "/attendance": 1,
  "/leave-requests": 1,
  "/analytics": 2,
  "/users": 3,
  "/students": 4,
  "/announcements": 5,
  "/queries": 6,
  "/report": 7,
};

const ADMIN_NAV_PATHS = [
  "/dashboard",
  "/attendance",
  "/analytics",
  "/users",
  "/students",
  "/announcements",
  "/queries",
  "/report",
];

const PARTNER_PATH_TO_NAV = {
  "/partner/dashboard": 0,
  "/partner/attendance": 1,
  "/partner/analytics": 2,
  "/partner/students": 3,
  "/partner/announcements": 4,
  "/partner/support": 5,
  "/partner/profile": 6,
};

const PARTNER_NAV_PATHS = [
  "/partner/dashboard",
  "/partner/attendance",
  "/partner/analytics",
  "/partner/students",
  "/partner/announcements",
  "/partner/support",
  "/partner/profile",
];

const MITRA_PATH_TO_NAV = {
  "/mitra/dashboard": 0,
  "/mitra/attendance": 1,
  "/mitra/analytics": 2,
  "/mitra/students": 3,
  "/mitra/test-marks": 4,
  "/mitra/announcements": 5,
  "/mitra/profile": 6,
};

const MITRA_NAV_PATHS = [
  "/mitra/dashboard",
  "/mitra/attendance",
  "/mitra/analytics",
  "/mitra/students",
  "/mitra/test-marks",
  "/mitra/announcements",
  "/mitra/profile",
];

const ADMIN_PATHS = new Set(ADMIN_NAV_PATHS);
const PARTNER_PATHS = new Set(PARTNER_NAV_PATHS);
const MITRA_PATHS = new Set(MITRA_NAV_PATHS);

const readInitialSession = () => {
  if (!getAuthToken()) return null;
  const session = getSession();
  if (!session) return null;
  const tokenUser = getAuthPayload();
  // Backfill id/email from JWT when older sessions omitted them.
  if (tokenUser && (!session.email || session.id == null)) {
    const patched = {
      ...session,
      id: session.id ?? tokenUser.id,
      email: session.email || tokenUser.email || "",
      role: session.role || tokenUser.role || "",
      centre: session.centre ?? tokenUser.centre ?? null,
    };
    setSession(patched);
    return patched;
  }
  return session;
};

const getFocusableFields = (form) => {
  if (!form) return [];

  return Array.from(
    form.querySelectorAll(
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => {
    if (!(element instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(element);
    return style.visibility !== "hidden" && style.display !== "none";
  });
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSession = readInitialSession();

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialSession));
  const [userName, setUserName] = useState(initialSession?.name || "");
  const [userEmail, setUserEmail] = useState(initialSession?.email || "");
  const [userId, setUserId] = useState(initialSession?.id ?? null);
  const [userCentre, setUserCentre] = useState(initialSession?.centre ?? null);
  const [userRole, setUserRole] = useState(initialSession?.role || "");
  const [selectedPortal, setSelectedPortal] = useState(initialSession?.portal || "");
  const [isCustomCentre, setIsCustomCentre] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      clearSession();
      setIsLoggedIn(false);
      return;
    }
    const tokenUser = getAuthPayload();
    if (!tokenUser) return;

    setUserEmail((prev) => {
      if (prev) return prev;
      if (tokenUser.email) {
        updateSession({ email: tokenUser.email });
        return tokenUser.email;
      }
      return prev;
    });
    setUserId((prev) => {
      if (prev != null) return prev;
      if (tokenUser.id != null) {
        updateSession({ id: tokenUser.id });
        return tokenUser.id;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleFormEnterNavigation = (event) => {
      if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.isContentEditable) return;

      const form = target.closest("form");
      if (!form) return;

      const focusableFields = getFocusableFields(form);
      const currentIndex = focusableFields.indexOf(target);
      if (currentIndex === -1) return;

      event.preventDefault();

      const nextField = focusableFields[currentIndex + 1];
      if (nextField) {
        nextField.focus();
        if (typeof nextField.select === "function") {
          nextField.select();
        }
        return;
      }

      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.submit();
      }
    };

    document.addEventListener("keydown", handleFormEnterNavigation);
    return () => document.removeEventListener("keydown", handleFormEnterNavigation);
  }, []);

  const isAdmin = canEnterAdminDashboard(userRole);
  const isPartner = canEnterPartnerDashboard(userRole);
  const isMitra = canEnterSatheeMitraDashboard(userRole);

  const adminNavItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: CalendarDays, label: "Attendance Record" },
    { icon: TrendingUp, label: "Progress and Analytics" },
    { icon: Users, label: "Users & Roles" },
    { icon: IdCard, label: "Students" },
    { icon: Megaphone, label: "Announcements" },
    { icon: MessageSquareText, label: "Queries" },
    { icon: FileBarChart2, label: "Kendra Report" },
  ];

  const partnerNavItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: CalendarDays, label: "Attendance Record" },
    { icon: TrendingUp, label: "Progress and Analytics" },
    { icon: IdCard, label: "Students" },
    { icon: Megaphone, label: "Announcements" },
    { icon: MessageSquareText, label: "Query and Support" },
    { icon: UserCircle, label: "My Profile" },
  ];

  const mitraNavItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: CalendarDays, label: "Attendance Record" },
    { icon: TrendingUp, label: "Progress and Analytics" },
    { icon: IdCard, label: "Students" },
    { icon: ClipboardList, label: "Test Marks" },
    { icon: Megaphone, label: "Announcements" },
    { icon: UserCircle, label: "My Profile" },
  ];

  const activeNav = isMitra
    ? MITRA_PATH_TO_NAV[location.pathname] ?? 0
    : isPartner
      ? PARTNER_PATH_TO_NAV[location.pathname] ?? 0
      : ADMIN_PATH_TO_NAV[location.pathname] ?? 0;

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
    setUserId(null);
    setUserCentre(null);
    setUserRole("");
    setSelectedPortal("");
    setIsCustomCentre(false);
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      setIsLoggedIn(false);
      setUserName("");
      setUserEmail("");
      setUserId(null);
      setUserCentre(null);
      setUserRole("");
      setSelectedPortal("");
      setIsCustomCentre(false);
      navigate("/", { replace: true });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [navigate]);

  const handleAdminNavChange = (index) => {
    const path = ADMIN_NAV_PATHS[index];
    if (path) navigate(path);
  };

  const handlePartnerNavChange = (index) => {
    const path = PARTNER_NAV_PATHS[index];
    if (path) navigate(path);
  };

  const handleMitraNavChange = (index) => {
    const path = MITRA_NAV_PATHS[index];
    if (path) navigate(path);
  };

  const selectPortal = (name) => {
    setSelectedPortal(name);
    setIsCustomCentre(false);
    updateSession({ portal: name, isCustomCentre: false });
  };

  const openPortal = (name) => {
    if (!canAccessPortal(userCentre, name, userRole)) return;
    selectPortal(name);
    if (canEnterAdminDashboard(userRole)) navigate("/dashboard");
    else if (canEnterPartnerDashboard(userRole)) navigate("/partner/dashboard");
    else if (canEnterSatheeMitraDashboard(userRole)) navigate("/mitra/dashboard");
  };

  const adminLayout = {
    portalName: selectedPortal,
    isCustomCentre,
    navItems: adminNavItems,
    activeNav,
    onNavChange: handleAdminNavChange,
    onLogout: handleLogout,
  };

  const partnerLayout = {
    portalName: selectedPortal,
    isCustomCentre,
    navItems: partnerNavItems,
    activeNav,
    onNavChange: handlePartnerNavChange,
    onLogout: handleLogout,
  };

  const mitraLayout = {
    portalName: selectedPortal,
    isCustomCentre,
    navItems: mitraNavItems,
    activeNav,
    onNavChange: handleMitraNavChange,
    onLogout: handleLogout,
  };

  if (location.pathname === "/create-password") {
    return <CreatePassword />;
  }

  if (location.pathname === "/forgot-password") {
    return <ForgetPassword />;
  }

  // Public pages, linked from the login page footer.
  if (location.pathname === "/privacy" || location.pathname === "/terms") {
    return <LegalPage page={location.pathname.slice(1)} />;
  }

  if (!isLoggedIn) {
    return (
      <Authentication
        onLoginSuccess={(user) => {
          const name = typeof user === "string" ? user : user?.name;
          const role = typeof user === "object" ? user?.role || "" : "";
          const centre = typeof user === "object" ? user?.centre ?? null : null;
          const email = typeof user === "object" ? user?.email || "" : "";
          const id = typeof user === "object" ? user?.id ?? null : null;
          setUserName(name || "Administrator");
          setUserEmail(email);
          setUserId(id);
          setUserCentre(centre);
          setUserRole(role);
          setSelectedPortal("");
          setSession({
            id,
            name: name || "Administrator",
            email,
            role,
            centre,
            portal: "",
            isCustomCentre: false,
            lastLoginAt: typeof user === "object" ? user?.lastLoginAt : undefined,
          });
          setIsLoggedIn(true);
        }}
      />
    );
  }

  // Role-based route guards
  if (location.pathname === "/centres" && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Each user only opens their own platform: HCL SATHEE users the state
  // portals, SATHEE Kendra users the SATHEE Kendras page (admins: both).
  if (location.pathname === "/portals" && !canOpenPlatform("HCL SATHEE", userCentre, userRole)) {
    return <Navigate to="/" replace />;
  }
  if (location.pathname === "/kendras" && !canOpenPlatform("SATHEE", userCentre, userRole)) {
    return <Navigate to="/" replace />;
  }

  if (ADMIN_PATHS.has(location.pathname) && (!isAdmin || !selectedPortal)) {
    return <Navigate to="/portals" replace />;
  }

  if (PARTNER_PATHS.has(location.pathname)) {
    if (!isPartner || !selectedPortal) {
      return <Navigate to="/portals" replace />;
    }
    if (!isCustomCentre && !canAccessPortal(userCentre, selectedPortal, userRole)) {
      return <Navigate to="/portals" replace />;
    }
  }

  if (MITRA_PATHS.has(location.pathname)) {
    if (!isMitra || !selectedPortal) {
      return <Navigate to="/portals" replace />;
    }
    if (!isCustomCentre && !canAccessPortal(userCentre, selectedPortal, userRole)) {
      return <Navigate to="/portals" replace />;
    }
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<CardSelector_1 openHCLSathee={() => navigate("/portals")} openKendras={() => navigate("/kendras")} openPortal={openPortal} onLogout={handleLogout} userRole={userRole} userCentre={userCentre} />} />

        <Route
          path="/kendras"
          element={
            <CardSelector_2
              network="sathee"
              onBack={() => navigate("/")}
              onLogout={handleLogout}
              userCentre={userCentre}
              userRole={userRole}
              openDashboard={openPortal}
            />
          }
        />

        <Route
          path="/portals"
          element={
            <CardSelector_2
              onBack={() => navigate("/")}
              onLogout={handleLogout}
              userCentre={userCentre}
              userRole={userRole}
              openDashboard={openPortal}
            />
          }
        />

        <Route
          path="/centres"
          element={
            <OtherCentres
              {...adminLayout}
              activeNav={-1}
              currentPortal={selectedPortal}
              onOpenCentre={(portalName) => {
                selectPortal(portalName);
                navigate("/dashboard");
              }}
            />
          }
        />

        <Route path="/dashboard" element={<Dashboard key={`dashboard-${selectedPortal}-${isCustomCentre}`} {...adminLayout} userName={userName} />} />
        <Route path="/attendance" element={<AdminAttendance key={`attendance-${selectedPortal}-${isCustomCentre}`} {...adminLayout} />} />
        <Route path="/leave-requests" element={<AdminLeaveRequests key={`leave-${selectedPortal}-${isCustomCentre}`} {...adminLayout} />} />
        <Route path="/analytics" element={<AdminAnalytics key={`analytics-${selectedPortal}-${isCustomCentre}`} {...adminLayout} />} />
        <Route path="/users" element={<AdminUser key={`users-${selectedPortal}-${isCustomCentre}`} {...adminLayout} />} />
        <Route path="/students" element={<Student key={`students-${selectedPortal}-${isCustomCentre}`} {...adminLayout} />} />
        <Route
          path="/announcements"
          element={<AdminAnnouncements key={`announcements-${selectedPortal}-${isCustomCentre}`} {...adminLayout} userName={userName} />}
        />
        <Route
          path="/queries"
          element={<AdminQueries {...adminLayout} userName={userName} />}
        />
        <Route
          path="/report"
          element={<CentreReport key={`report-${selectedPortal}-${isCustomCentre}`} {...adminLayout} />}
        />

        <Route path="/partner/dashboard" element={<HCLPartnerDashboard key={`pdash-${selectedPortal}-${isCustomCentre}`} {...partnerLayout} userName={userName} />} />
        <Route path="/partner/attendance" element={<HCLPartnerAttendance key={`patt-${selectedPortal}-${isCustomCentre}`} {...partnerLayout} />} />
        <Route path="/partner/analytics" element={<HCLPartnerAnalytics key={`pana-${selectedPortal}-${isCustomCentre}`} {...partnerLayout} />} />
        <Route path="/partner/students" element={<PartnerStudents key={`pstu-${selectedPortal}-${isCustomCentre}`} {...partnerLayout} />} />
        <Route
          path="/partner/announcements"
          element={<HCLPartnerAnnouncements key={`pann-${selectedPortal}-${isCustomCentre}`} {...partnerLayout} userName={userName} />}
        />
        <Route
          path="/partner/support"
          element={<QueryAndSupport key={`psup-${selectedPortal}-${isCustomCentre}`} {...partnerLayout} userName={userName} userEmail={userEmail} />}
        />
        <Route
          path="/partner/profile"
          element={
            <MyProfile
              key={`pprof-${selectedPortal}-${isCustomCentre}`}
              {...partnerLayout}
              roleLabel="Partner Portal"
              userName={userName}
              userEmail={userEmail}
              userId={userId}
              userCentre={userCentre}
              userRole={userRole}
            />
          }
        />

        <Route path="/mitra/dashboard" element={<SatheeMitraDashboard key={`mdash-${selectedPortal}-${isCustomCentre}`} {...mitraLayout} userName={userName} />} />
        <Route
          path="/mitra/attendance"
          element={
            <SM_Attendance
              key={`matt-${selectedPortal}-${isCustomCentre}`}
              {...mitraLayout}
              userName={userName}
              userEmail={userEmail}
              userId={userId}
              userCentre={userCentre}
            />
          }
        />
        <Route path="/mitra/analytics" element={<SM_Analytics key={`mana-${selectedPortal}-${isCustomCentre}`} {...mitraLayout} />} />
        <Route path="/mitra/students" element={<SM_Student key={`mstu-${selectedPortal}-${isCustomCentre}`} {...mitraLayout} />} />
        <Route path="/mitra/test-marks" element={<SM_TestMarks key={`mtest-${selectedPortal}-${isCustomCentre}`} {...mitraLayout} userCentre={userCentre} />} />
        <Route path="/mitra/announcements" element={<SatheeMitraAnnouncements key={`mann-${selectedPortal}-${isCustomCentre}`} {...mitraLayout} userName={userName} />} />
        <Route
          path="/mitra/profile"
          element={
            <MyProfile
              key={`mprof-${selectedPortal}-${isCustomCentre}`}
              {...mitraLayout}
              roleLabel="Sathee Mitra Portal"
              userName={userName}
              userEmail={userEmail}
              userId={userId}
              userCentre={userCentre}
              userRole={userRole}
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

// Each page is downloaded only when it is first opened, so the login screen
// appears quickly even on slow mobile data (the whole site used to be one
// ~650 KB download before anything showed).
function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1F5F9]" role="status">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <span className="text-sm font-medium">Loading…</span>
      </div>
    </div>
  );
}

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoading />}>
      <AppContent />
    </Suspense>
  </BrowserRouter>
);

export default App;
