import { CheckCircle2, Clock, Mail, Phone, Send, Trash2, Users as UsersIcon } from "lucide-react";

const DEFAULT_BADGE = { bg: "bg-gray-100 text-gray-700 border border-gray-200", icon: null };

const formatDateAdded = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// "Just now", "5 min ago", "3 days ago", then a plain date after a month.
const formatLastLogin = (value, now) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const minutes = Math.floor((now - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDateAdded(value);
};

function StatusTag({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
      <CheckCircle2 size={12} />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
      <Clock size={12} />
      Invite pending
    </span>
  );
}

function RoleTag({ role, roleBadge }) {
  const badge = roleBadge[role] ?? DEFAULT_BADGE;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg}`}>
      {badge.icon}
      {role}
    </span>
  );
}

function Avatar({ user, avatarColor }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
        avatarColor[user.role] || "bg-gray-600"
      }`}
    >
      {user.avatar}
    </span>
  );
}

function Actions({ user, onResendInvite, onDeleteUser, resendingId }) {
  const resending = resendingId === user.id;
  return (
    <div className="flex items-center justify-end gap-1">
      {!user.hasPassword ? (
        <button
          type="button"
          onClick={() => onResendInvite(user)}
          disabled={resending}
          title="Send the set-password email again"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-700 disabled:opacity-60"
        >
          <Send size={13} />
          {resending ? "Sending…" : "Resend"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onDeleteUser(user)}
        aria-label={`Remove ${user.name}`}
        title="Remove user"
        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

const UserTable = ({
  users,
  allUsersCount,
  roleBadge,
  avatarColor,
  onDeleteUser,
  onResendInvite,
  resendingId = null,
  loading,
  now,
}) => {
  const actionProps = { onResendInvite, onDeleteUser, resendingId };

  let body;
  if (loading) {
    body = <p className="py-16 text-center text-sm font-medium text-slate-500">Loading users…</p>;
  } else if (users.length === 0) {
    body = (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <UsersIcon size={36} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">No users found</p>
        <p className="mt-1 text-xs text-slate-400">Try adjusting your search or filter</p>
      </div>
    );
  } else {
    body = (
      <>
        {/* Desktop table */}
        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">User</th>
                <th className="whitespace-nowrap px-4 py-3">Contact</th>
                <th className="whitespace-nowrap px-4 py-3">Role</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="whitespace-nowrap px-4 py-3">Last login</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} avatarColor={avatarColor} />
                      <span className="whitespace-nowrap text-sm font-semibold text-slate-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="flex items-center gap-1.5 text-sm text-slate-700">
                      <Mail size={13} className="shrink-0 text-slate-400" />
                      {user.email}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                      <Phone size={13} className="shrink-0 text-slate-400" />
                      {user.phone || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <RoleTag role={user.role} roleBadge={roleBadge} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag active={user.hasPassword} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-sm text-slate-700">
                      {formatLastLogin(user.lastLoginAt, now) || <span className="text-slate-400">Never</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">Added {formatDateAdded(user.created_at)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Actions user={user} {...actionProps} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phone and tablet cards */}
        <ul className="divide-y divide-slate-100 xl:hidden">
          {users.map((user) => (
            <li key={user.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <Avatar user={user} avatarColor={avatarColor} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <RoleTag role={user.role} roleBadge={roleBadge} />
                    <StatusTag active={user.hasPassword} />
                  </div>
                  <p className="mt-2 break-all text-sm text-slate-600">{user.email}</p>
                  <p className="text-sm text-slate-500">{user.phone || "—"}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Last login: {formatLastLogin(user.lastLoginAt, now) || "Never"} · Added{" "}
                    {formatDateAdded(user.created_at)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Actions user={user} {...actionProps} />
              </div>
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <>
      {body}
      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{users.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{allUsersCount}</span> users
        </p>
      </div>
    </>
  );
};

export default UserTable;
