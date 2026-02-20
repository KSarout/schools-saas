"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useCreateUser, useUpdateUser, useUsersList } from "@/features/users/hooks/useUsers";
import type { CreateUserPayload, UpdateUserPayload, UserDto, UserRole } from "@/features/users/dto/users.dto";
import { UserFormDialog } from "@/features/users/components/UserFormDialog";
import { ResetUserPasswordDialog } from "@/features/users/components/ResetUserPasswordDialog";
import { useSchoolMe } from "@/features/school-auth/hooks/useSchoolAuth";
import { can, SchoolPermissions } from "@/features/school-auth/rbac/schoolRbac";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UsersPageView() {
    const [q, setQ] = useState("");
    const debouncedQ = useDebouncedValue(q, 300);
    const [page, setPage] = useState(1);
    const limit = 10;
    const [role, setRole] = useState<UserRole | "ALL">("ALL");
    const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

    const params = useMemo(() => ({
        q: debouncedQ.trim() || undefined,
        role: role === "ALL" ? undefined : role,
        status: status === "ALL" ? undefined : status,
        page,
        limit,
    }), [debouncedQ, role, status, page]);

    const list = useUsersList(params);
    const createMut = useCreateUser();
    const updateMut = useUpdateUser();

    const me = useSchoolMe();
    const canManage = can(me.data?.user?.role, SchoolPermissions.manageUsers);

    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formOpen, setFormOpen] = useState(false);
    const [active, setActive] = useState<UserDto | null>(null);
    const [createdSecret, setCreatedSecret] = useState<null | { email: string; tempPassword: string }>(null);

    const [resetOpen, setResetOpen] = useState(false);

    async function submit(payload: CreateUserPayload | UpdateUserPayload) {
        if (!canManage) throw new Error("Forbidden");

        if (formMode === "create") {
            const created = await createMut.mutateAsync(payload as CreateUserPayload);
            setCreatedSecret({ email: created.user.email, tempPassword: created.tempPassword });
            toast.success("User created");
            return;
        }

        if (!active) return;
        await updateMut.mutateAsync({ id: active.id, payload: payload as UpdateUserPayload });
        toast.success("User updated");
        setFormOpen(false);
    }

    async function deactivate(user: UserDto) {
        if (!canManage) throw new Error("Forbidden");
        await updateMut.mutateAsync({ id: user.id, payload: { isActive: false } });
        toast.success("User deactivated");
    }

    const totalPages = list.data?.totalPages ?? 1;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Settings • Users</CardTitle>
                    {canManage ? (
                        <Button
                            onClick={() => {
                                setFormMode("create");
                                setActive(null);
                                setCreatedSecret(null);
                                setFormOpen(true);
                            }}
                        >
                            Create User
                        </Button>
                    ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <Input
                            placeholder="Search name or email..."
                            value={q}
                            onChange={(e) => {
                                setQ(e.target.value);
                                setPage(1);
                            }}
                        />

                        <Select
                            value={role}
                            onValueChange={(v) => {
                                setRole(v as UserRole | "ALL");
                                setPage(1);
                            }}
                        >
                            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All roles</SelectItem>
                                <SelectItem value="SCHOOL_ADMIN">SCHOOL_ADMIN</SelectItem>
                                <SelectItem value="TEACHER">TEACHER</SelectItem>
                                <SelectItem value="ACCOUNTANT">ACCOUNTANT</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={status}
                            onValueChange={(v) => {
                                setStatus(v as "ALL" | "ACTIVE" | "INACTIVE");
                                setPage(1);
                            }}
                        >
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All status</SelectItem>
                                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center justify-end text-sm text-muted-foreground">
                            Total {list.data?.total ?? 0}
                        </div>
                    </div>

                    {list.isError ? <p className="text-sm text-red-600">{(list.error as Error).message}</p> : null}

                    <div className="overflow-x-auto rounded border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40">
                            <tr>
                                <th className="px-3 py-2 text-left">Name</th>
                                <th className="px-3 py-2 text-left">Email</th>
                                <th className="px-3 py-2 text-left">Role</th>
                                <th className="px-3 py-2 text-left">Status</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(list.data?.items ?? []).map((u) => (
                                <tr key={u.id} className="border-t">
                                    <td className="px-3 py-2">{u.name}</td>
                                    <td className="px-3 py-2">{u.email}</td>
                                    <td className="px-3 py-2">{u.role}</td>
                                    <td className="px-3 py-2">{u.isActive ? "ACTIVE" : "INACTIVE"}</td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="inline-flex gap-2">
                                            {canManage ? (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setFormMode("edit");
                                                            setCreatedSecret(null);
                                                            setActive(u);
                                                            setFormOpen(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setActive(u);
                                                            setResetOpen(true);
                                                        }}
                                                    >
                                                        Reset Password
                                                    </Button>

                                                    {u.isActive ? (
                                                        <Button variant="destructive" size="sm" onClick={() => deactivate(u)}>
                                                            Deactivate
                                                        </Button>
                                                    ) : null}
                                                </>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(list.data?.items ?? []).length === 0 && !list.isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No users found.</td>
                                </tr>
                            ) : null}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Page {page} / {totalPages}</div>
                        <div className="flex gap-2">
                            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {formOpen ? (
                <UserFormDialog
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    mode={formMode}
                    initial={active}
                    submitting={createMut.isPending || updateMut.isPending}
                    error={createMut.isError ? (createMut.error as Error).message : updateMut.isError ? (updateMut.error as Error).message : null}
                    onSubmit={submit}
                />
            ) : null}

            {createdSecret ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Temporary Password</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div><b>Email:</b> {createdSecret.email}</div>
                        <div><b>Temp Password:</b> <span className="font-mono">{createdSecret.tempPassword}</span></div>
                        <p className="text-muted-foreground">Store this now. User must change password after first login.</p>
                    </CardContent>
                </Card>
            ) : null}

            <ResetUserPasswordDialog open={resetOpen} onOpenChange={setResetOpen} user={active} />
        </div>
    );
}
