"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import {
    useCreateSuperAdminUser,
    useResetSuperAdminUserPassword,
    useSuperAdminUsers,
    useUpdateSuperAdminUser,
} from "@/features/super-admin/hooks/useSuperAdminUsers";
import type {
    CreateSuperAdminUserPayload,
    SuperAdminUser,
    UpdateSuperAdminUserPayload,
} from "@/features/super-admin/api/uperAdmin.dto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminUsersPageView() {
    const [q, setQ] = useState("");
    const debouncedQ = useDebouncedValue(q, 300);
    const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
    const [page, setPage] = useState(1);
    const limit = 10;

    const params = useMemo(() => ({
        q: debouncedQ.trim() || undefined,
        status: status === "ALL" ? undefined : status,
        page,
        limit,
    }), [debouncedQ, status, page]);

    const list = useSuperAdminUsers(params);
    const createMut = useCreateSuperAdminUser();
    const updateMut = useUpdateSuperAdminUser();
    const resetMut = useResetSuperAdminUserPassword();

    const [formOpen, setFormOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [active, setActive] = useState<SuperAdminUser | null>(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [secret, setSecret] = useState<null | { email: string; tempPassword: string }>(null);

    function openCreate() {
        setMode("create");
        setActive(null);
        setName("");
        setEmail("");
        setFormOpen(true);
    }

    function openEdit(user: SuperAdminUser) {
        setMode("edit");
        setActive(user);
        setName(user.name);
        setEmail(user.email);
        setFormOpen(true);
    }

    async function submit() {
        if (mode === "create") {
            const payload: CreateSuperAdminUserPayload = { name: name.trim(), email: email.trim().toLowerCase() };
            const created = await createMut.mutateAsync(payload);
            toast.success("User created");
            setSecret({ email: created.user.email, tempPassword: created.tempPassword });
            setFormOpen(false);
            return;
        }

        if (!active) return;
        const payload: UpdateSuperAdminUserPayload = {};
        if (name.trim() !== active.name) payload.name = name.trim();
        if (Object.keys(payload).length === 0) {
            setFormOpen(false);
            return;
        }

        await updateMut.mutateAsync({ id: active.id, payload });
        toast.success("User updated");
        setFormOpen(false);
    }

    async function deactivate(user: SuperAdminUser) {
        await updateMut.mutateAsync({ id: user.id, payload: { isActive: false } });
        toast.success("User deactivated");
    }

    async function resetPassword(user: SuperAdminUser) {
        const rotated = await resetMut.mutateAsync(user.id);
        setSecret({ email: rotated.email, tempPassword: rotated.tempPassword });
        toast.success("Password reset");
    }

    const totalPages = list.data?.totalPages ?? 1;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Super Admin Users</CardTitle>
                    <Button onClick={openCreate}>Create User</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Input
                            placeholder="Search name or email..."
                            value={q}
                            onChange={(e) => {
                                setQ(e.target.value);
                                setPage(1);
                            }}
                        />
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
                        <div className="flex items-center justify-end text-sm text-muted-foreground">Total {list.data?.total ?? 0}</div>
                    </div>

                    {list.isError ? <p className="text-sm text-red-600">{(list.error as Error).message}</p> : null}

                    <div className="overflow-x-auto rounded border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40">
                            <tr>
                                <th className="px-3 py-2 text-left">Name</th>
                                <th className="px-3 py-2 text-left">Email</th>
                                <th className="px-3 py-2 text-left">Status</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(list.data?.items ?? []).map((u) => (
                                <tr key={u.id} className="border-t">
                                    <td className="px-3 py-2">{u.name}</td>
                                    <td className="px-3 py-2">{u.email}</td>
                                    <td className="px-3 py-2">{u.isActive ? "ACTIVE" : "INACTIVE"}</td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="inline-flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(u)}>Edit</Button>
                                            <Button variant="outline" size="sm" onClick={() => resetPassword(u)}>Reset Password</Button>
                                            {u.isActive ? (
                                                <Button variant="destructive" size="sm" onClick={() => deactivate(u)}>Deactivate</Button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(list.data?.items ?? []).length === 0 && !list.isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No users found.</td>
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

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{mode === "create" ? "Create Super Admin User" : "Edit Super Admin User"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <Input value={email} disabled={mode === "edit"} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        {createMut.isError ? <p className="text-sm text-red-600">{(createMut.error as Error).message}</p> : null}
                        {updateMut.isError ? <p className="text-sm text-red-600">{(updateMut.error as Error).message}</p> : null}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                        <Button onClick={submit} disabled={createMut.isPending || updateMut.isPending}>
                            {createMut.isPending || updateMut.isPending ? "Saving..." : mode === "create" ? "Create" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {secret ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Temporary Password</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div><b>Email:</b> {secret.email}</div>
                        <div><b>Temp Password:</b> <span className="font-mono">{secret.tempPassword}</span></div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
