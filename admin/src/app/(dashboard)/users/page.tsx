"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  PageHeader,
  Spinner,
  StatusBadge,
  Tabs,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
} from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import {
  useDeleteUser,
  useSetBanned,
  useUsers,
} from "@/services/users/users.queries";
import {
  ROLE_LABELS,
  type AdminUserRow,
  type UserRole,
} from "@/services/users/users.types";
import { formatDateTime } from "@/lib/format";

type RoleFilter = UserRole | "ALL";

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: "Everyone", value: "ALL" },
  { label: "Families", value: "FAMILY" },
  { label: "Nurses", value: "CAREGIVER" },
  { label: "Coordinators", value: "CARE_COORDINATOR" },
  { label: "Admins", value: "ADMIN" },
];

export default function UsersPage() {
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);

  const apiRole = role === "ALL" ? undefined : role;
  const { data, isLoading, isError, error, isFetching } = useUsers(
    debounced,
    apiRole,
  );
  const setBanned = useSetBanned();
  const deleteUser = useDeleteUser();

  const users = useMemo(() => data ?? [], [data]);

  async function toggleBan(u: AdminUserRow) {
    setActingId(u.id);
    setErrorMsg(null);
    try {
      await setBanned.mutateAsync({
        id: u.id,
        banned: u.status !== "BANNED",
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActingId(null);
    }
  }

  async function removeUser(u: AdminUserRow) {
    if (
      !window.confirm(
        `Permanently delete ${u.name}? This cannot be undone.`,
      )
    )
      return;
    setActingId(u.id);
    setErrorMsg(null);
    try {
      await deleteUser.mutateAsync(u.id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Couldn't delete.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Every account on the platform. Review last-login activity, ban, or remove users."
      />

      <Card padded={false} className="overflow-hidden">
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-field bg-field px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/15">
            <SearchIcon size={16} className="shrink-0 text-faint" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
            />
            {isFetching && <Spinner size={14} />}
          </div>
        </div>

        <div className="px-4 pt-2">
          <Tabs tabs={ROLE_TABS} value={role} onChange={setRole} />
        </div>

        {errorMsg && (
          <p className="mx-4 mt-2 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
            {errorMsg}
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-brand">
            <Spinner size={26} />
          </div>
        ) : isError ? (
          <p className="px-5 py-16 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load users."}
          </p>
        ) : users.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted">
            No users in this view.
          </p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Last login</Th>
                <Th>IP address</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((u) => {
                const isAdmin = u.role === "ADMIN";
                const busy = actingId === u.id;
                return (
                  <Tr key={u.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} photoUrl={u.photoUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{u.name}</p>
                          <p className="truncate text-xs text-muted">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone="slate">{ROLE_LABELS[u.role]}</Badge>
                    </Td>
                    <Td className="text-muted">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                    </Td>
                    <Td className="font-mono text-xs text-muted">
                      {u.lastLoginIp ?? "—"}
                    </Td>
                    <Td>
                      <StatusBadge status={u.status} />
                    </Td>
                    <Td className="text-right">
                      {isAdmin ? (
                        <span className="text-xs text-faint">—</span>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant={u.status === "BANNED" ? "subtle" : "outline"}
                            loading={busy && setBanned.isPending}
                            disabled={busy}
                            onClick={() => toggleBan(u)}
                          >
                            {u.status === "BANNED" ? "Unban" : "Ban"}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={busy && deleteUser.isPending}
                            disabled={busy}
                            onClick={() => removeUser(u)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
