import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, GraduationCap, HeartHandshake, Plus, Shield, UsersRound } from "lucide-react";

import UserFilter from "../../Components/User/UserFilter";
import UserToolbar from "../../Components/User/UserToolbar";
import UserTable from "../../Components/User/UserTable";
import NewUser from "../../Components/User/NewUser";
import { MainLayout } from "../../Components/MainLayout";
import { createUser, fetchUsers, removeUser, resendInvite } from "../../services/users";
import { displayRole, matchesPortalCentre } from "../../utils/portalMapping";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { getInitials } from "../../utils/studentMetrics";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";
import { sortTableRows } from "../../utils/tableSort";
import { downloadTableXlsx } from "../../utils/exportTable";

const ROLE_FILTERS = ["All Users", "ADMIN", "SATHEE MITRA", "HCL PARTNER"];

const roleBadge = {
  ADMIN: { bg: "bg-blue-100 text-blue-700 border border-blue-200", icon: <Shield size={11} className="inline mr-1" /> },
  "SATHEE MITRA": { bg: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <GraduationCap size={11} className="inline mr-1" /> },
  "HCL PARTNER": { bg: "bg-purple-100 text-purple-700 border border-purple-200", icon: <HeartHandshake size={11} className="inline mr-1" /> },
};

const avatarColor = {
  ADMIN: "bg-blue-600",
  "SATHEE MITRA": "bg-emerald-600",
  "HCL PARTNER": "bg-purple-600",
};

const normalizeUser = (user) => ({
  ...user,
  role: user.role?.toUpperCase() || user.role,
  avatar: getInitials(user.name),
});

export default function AdminUser({ portalName, navItems, activeNav, onNavChange, onLogout, isCustomCentre = false }) {
  const [activeFilter, setActiveFilter] = useState("All Users");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [passwordSetupLink, setPasswordSetupLink] = useState("");
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [notice, setNotice] = useState("");
  // Fixed per visit so "last login" labels don't change between renders.
  const [now] = useState(() => Date.now());
  useEscapeToClose(() => setUserToDelete(null), Boolean(userToDelete) && !deletingUser);

  const loadUsers = useCallback(async () => {
    // Skip loading for custom centres
    if (isCustomCentre) {
      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    try {
      const data = await fetchUsers();
      setUsers(data.map(normalizeUser));
      setUsersError("");
    } catch (error) {
      console.error("Fetch Users Error:", error);
      setUsersError(getApiErrorMessage(error, "Unable to load users from the database"));
    } finally {
      setLoadingUsers(false);
    }
  }, [isCustomCentre]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const isVisibleOnPortal = useCallback(
    (user) => user.role === "ADMIN" || matchesPortalCentre(user.centre, portalName),
    [portalName]
  );

  const visibleUsers = useMemo(
    () => users.filter(isVisibleOnPortal),
    [users, isVisibleOnPortal]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return visibleUsers.filter((user) => {
      const matchesRole = activeFilter === "All Users" || user.role === activeFilter;
      const matchesSearch =
        !q ||
        (user.name || "").toLowerCase().includes(q) ||
        (user.email || "").toLowerCase().includes(q) ||
        (user.phone || "").toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [visibleUsers, activeFilter, search]);

  const sortedUsers = useMemo(
    () => sortTableRows(filtered, { sortBy, direction: sortDirection }),
    [filtered, sortBy, sortDirection]
  );

  // Exports exactly what the list shows (current role tab, search and sort). No passwords.
  const handleExport = () => {
    const date = (value) => (value ? new Date(value).toLocaleString("en-GB") : "");
    downloadTableXlsx({
      filename: `users-${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Users",
      headers: ["Name", "Email", "Phone", "Role", "Centre", "Status", "Last login", "Added on"],
      rows: sortedUsers.map((u) => [
        u.name || "",
        u.email || "",
        u.phone || "",
        displayRole(u.role, portalName),
        u.centre || "",
        u.hasPassword ? "Active" : "Invite pending",
        u.lastLoginAt ? date(u.lastLoginAt) : "Never",
        u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB") : "",
      ]),
    });
  };

  const roleCount = (role) =>
    role === "All Users"
      ? visibleUsers.length
      : visibleUsers.filter((user) => user.role === role).length;

  const handleAddUser = async (newUser) => {
    setSubmittingUser(true);
    setUsersError("");
    setNotice("");
    setPasswordSetupLink("");

    try {
      const result = await createUser(newUser);
      const normalizedUser = normalizeUser(result.user);
      setUsers((prev) => [...prev, normalizedUser]);
      setActiveFilter(normalizedUser.role);
      setSearch("");

      if (!result.emailSent) {
        setUsersError(
          result.emailError
            ? `User saved, but email failed: ${result.emailError}`
            : "User saved, but the welcome email was not sent."
        );
        if (result.passwordSetupLink) {
          setPasswordSetupLink(result.passwordSetupLink);
        }
      }

      return true;
    } catch (error) {
      console.error("Create User Error:", error);
      throw new Error(getApiErrorMessage(error, "Unable to save the user to the database"), {
        cause: error,
      });
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteUser = (user) => {
    setUsersError("");
    setNotice("");
    setUserToDelete(user);
  };
  const handleResendInvite = async (user) => {
    setUsersError("");
    setNotice("");
    setResendingId(user.id);
    try {
      const result = await resendInvite(user.id);
      if (result.emailSent) {
        setNotice(`Invite sent again to ${user.email}.`);
      } else {
        setUsersError(result.message || "Could not resend invite");
      }
    } catch (error) {
      console.error("Resend Invite Error:", error);
      setUsersError(getApiErrorMessage(error, "Unable to resend invite right now"));
    } finally {
      setResendingId(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUser(true);
    setUsersError("");

    try {
      await removeUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setNotice(`${userToDelete.name} was removed.`);
      setUserToDelete(null);
    } catch (error) {
      console.error("Delete User Error:", error);
      setUsersError(getApiErrorMessage(error, "Unable to delete the user right now"));
      setUserToDelete(null);
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <MainLayout
      portalName={portalName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
    >
      <div className="mx-auto max-w-7xl space-y-6 px-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <UsersRound size={22} />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users &amp; Roles</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Manage portal users, their roles and account status.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowNewUser(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>

        <UserFilter
          filters={ROLE_FILTERS}
          formatRole={(role) => displayRole(role, portalName)}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          roleCount={roleCount}
        />

        {notice ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={16} className="shrink-0" />
            {notice}
          </div>
        ) : null}

        {usersError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{usersError}</p>
            {passwordSetupLink ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-white px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Password setup link
                </p>
                <p className="mt-1 break-all text-slate-700">{passwordSetupLink}</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(passwordSetupLink);
                    } catch (error) {
                      console.error("Copy failed:", error);
                    }
                  }}
                  className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Copy link
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <UserToolbar
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={(nextSortBy, nextDirection) => {
              setSortBy(nextSortBy);
              setSortDirection(nextDirection);
            }}
            onExport={handleExport}
            exportCount={sortedUsers.length}
          />

          <UserTable
            users={sortedUsers}
            allUsersCount={roleCount("All Users")}
            roleBadge={roleBadge}
            formatRole={(role) => displayRole(role, portalName)}
            avatarColor={avatarColor}
            onDeleteUser={handleDeleteUser}
            onResendInvite={handleResendInvite}
            resendingId={resendingId}
            loading={loadingUsers}
            now={now}
          />
        </div>
      </div>

      {showNewUser ? (
        <NewUser
          onClose={() => setShowNewUser(false)}
          onAddUser={async (newUser) => {
            if (await handleAddUser(newUser)) setShowNewUser(false);
          }}
          submittingUser={submittingUser}
          portalName={portalName}
        />
      ) : null}

      {userToDelete ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deletingUser) setUserToDelete(null);
          }}
        >
          <div role="alertdialog" aria-modal="true" aria-labelledby="remove-user-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle size={22} />
              </span>
              <div className="min-w-0">
                <h3 id="remove-user-title" className="text-lg font-semibold text-slate-900">
                  Remove user?
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  <strong className="text-slate-900">{userToDelete.name}</strong>
                  <span className="block break-all text-slate-500">{userToDelete.email}</span>
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  They will no longer be able to log in to the portal. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUser}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deletingUser}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              >
                {deletingUser ? "Removing…" : "Remove user"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}
