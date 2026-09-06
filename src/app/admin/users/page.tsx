"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  UserX,
  UserCheck,
  Shield,
  Mail,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/lib/auth-context";
import {
  api,
  AdminUser,
  BackendRole,
  ROLE_LABELS,
  ROLE_OPTIONS,
} from "@/lib/api";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function roleBadgeClass(role: BackendRole): string {
  if (role === "CREATOR")
    return "bg-purple-50 text-purple-700 border border-purple-200";
  if (role === "ADMIN")
    return "bg-gray-100 text-gray-700 border border-gray-200";
  return "bg-blue-50 text-blue-700 border border-blue-200";
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [roleDialogUser, setRoleDialogUser] = useState<AdminUser | null>(null);
  const [roleDialogValue, setRoleDialogValue] = useState<BackendRole>("USER");
  const [roleUpdating, setRoleUpdating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminListUsers({ page: 1, pageSize: 100 });
      setUsers(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleSuspend = async (user: AdminUser) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const updated = await api.adminUpdateUserStatus(user.id, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      showToast(`User ${user.name} has been ${newStatus.toLowerCase()}.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update user");
    }
  };

  const openRoleDialog = (user: AdminUser, newRole: BackendRole) => {
    setRoleDialogUser(user);
    setRoleDialogValue(newRole);
  };

  const closeRoleDialog = () => {
    if (roleUpdating) return;
    setRoleDialogUser(null);
    setRoleDialogValue("USER");
  };

  const confirmRoleChange = async () => {
    if (!roleDialogUser) return;
    setRoleUpdating(true);
    try {
      const updated = await api.adminUpdateUserRole(
        roleDialogUser.id,
        roleDialogValue,
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === roleDialogUser.id ? updated : u)),
      );
      showToast(
        `${roleDialogUser.name} is now ${ROLE_LABELS[roleDialogValue] === "Admin" || ROLE_LABELS[roleDialogValue] === "Viewer" ? "an" : "a"} ${ROLE_LABELS[roleDialogValue]}.`,
      );
      setRoleDialogUser(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setRoleUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="User Management"
        subtitle="Search, inspect accounts, suspend and reactivate viewer and creator permissions."
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <ConfirmDialog
          open={!!roleDialogUser}
          title="Change user role?"
          message={
            roleDialogUser
              ? `Change ${roleDialogUser.name}\u2019s role from ${ROLE_LABELS[roleDialogUser.role]} to ${ROLE_LABELS[roleDialogValue]}?`
              : ""
          }
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          loading={roleUpdating}
          onConfirm={confirmRoleChange}
          onCancel={closeRoleDialog}
        />

        <div className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search user by name, email, or account ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
              id="admin-search-users-input"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-xl p-1 text-xs font-bold text-gray-700">
              {["ALL", "ACTIVE", "SUSPENDED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    statusFilter === st
                      ? "bg-white text-gray-950 shadow-xs"
                      : "hover:bg-gray-200/60 text-gray-500"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-400 font-bold">
              {filteredUsers.length} Users
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {error} — Please make sure the API is running and the database is
              reachable, then try again.
            </span>
            <button
              onClick={loadUsers}
              className="ml-auto px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow p-16 text-center text-sm text-gray-500">
            Loading users…
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="py-4 px-6">User Profile</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Email Verified</th>
                    <th className="py-4 px-6">Joined</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredUsers.map((user) => {
                    const isSelf = currentUser?.id === user.id;
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-evo-red-light text-evo-red border border-gray-200 flex items-center justify-center font-bold text-sm">
                              {initials(user.name)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-gray-400 text-[11px] flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          {isSelf ? (
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${roleBadgeClass(user.role)}`}
                            >
                              {ROLE_LABELS[user.role]}
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) =>
                                openRoleDialog(
                                  user,
                                  e.target.value as BackendRole,
                                )
                              }
                              disabled={roleUpdating}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border appearance-none cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-evo-red/30 ${
                                roleUpdating ? "opacity-60" : ""
                              } ${roleBadgeClass(user.role)}`}
                              aria-label={`Change role for ${user.name}`}
                            >
                              {ROLE_OPTIONS.map((opt) => {
                                const disabled =
                                  user.role === "USER" &&
                                  opt.value === "CREATOR";
                                return (
                                  <option
                                    key={opt.value}
                                    value={opt.value}
                                    disabled={disabled}
                                  >
                                    {opt.label}
                                  </option>
                                );
                              })}
                            </select>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              user.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-gray-600">
                          {user.emailVerified ? "Yes" : "No"}
                        </td>

                        <td className="py-4 px-6 text-gray-500 font-mono">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-6 text-right">
                          {user.role !== "ADMIN" ? (
                            <button
                              onClick={() => handleToggleSuspend(user)}
                              className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                                user.status === "ACTIVE"
                                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                              title={
                                user.status === "ACTIVE"
                                  ? "Suspend User"
                                  : "Reinstate User"
                              }
                            >
                              {user.status === "ACTIVE" ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                              <Shield className="w-3.5 h-3.5" /> Protected
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
