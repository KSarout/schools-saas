"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useSchoolMe } from "@/features/school-auth/hooks/useSchoolAuth";
import { can, SchoolPermissions } from "@/features/school-auth/rbac/schoolRbac";
import {
    useCreateSchoolUser,
    useDeactivateSchoolUser,
    useSchoolUsersList,
    useUpdateSchoolUser,
} from "@/features/school-users/hooks/useSchoolUsers";
import type {
    CreateSchoolUserPayload,
    SchoolUserDto,
    SchoolUserRole,
    SchoolUserStatus,
    UpdateSchoolUserPayload,
} from "@/features/school-users/api/schoolUsers.dto";
import { SchoolUserFormDialog } from "@/features/school-users/components/SchoolUserFormDialog";
import { DeactivateSchoolUserDialog } from "@/features/school-users/components/DeactivateSchoolUserDialog";
import { ResetSchoolUserPasswordDialog } from "@/features/school-users/components/ResetSchoolUserPasswordDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type FormMode = "create" | "edit";

export default function SchoolUsersPageView() {
    const t = useTranslations("school.users");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 350);
    const [page, setPage] = useState(1);
    const limit = 10;
    const [role, setRole] = useState<SchoolUserRole | "ALL">("ALL");
    const [status, setStatus] = useState<SchoolUserStatus | "ALL">("ALL");

    const params = useMemo(
        () => ({
            q: debouncedSearch.trim() || undefined,
            role: role === "ALL" ? undefined : role,
            status: status === "ALL" ? undefined : status,
            page,
            limit,
        }),
        [debouncedSearch, role, status, page]
    );

    const listQuery = useSchoolUsersList(params);
    const createMutation = useCreateSchoolUser();
    const updateMutation = useUpdateSchoolUser();
    const deactivateMutation = useDeactivateSchoolUser();

    const meQuery = useSchoolMe();
    const canManage = can(meQuery.data?.user?.role, SchoolPermissions.manageUsers);

    const [formMode, setFormMode] = useState<FormMode>("create");
    const [formOpen, setFormOpen] = useState(false);
    const [activeUser, setActiveUser] = useState<SchoolUserDto | null>(null);
    const [resetOpen, setResetOpen] = useState(false);
    const [deactivateOpen, setDeactivateOpen] = useState(false);
    const [createdSecret, setCreatedSecret] = useState<null | { email: string; tempPassword: string }>(null);
    const [copiedTempPassword, setCopiedTempPassword] = useState(false);

    async function onSubmitForm(payload: CreateSchoolUserPayload | UpdateSchoolUserPayload) {
        if (!canManage) throw new Error("Forbidden");

        if (formMode === "create") {
            const created = await createMutation.mutateAsync(payload as CreateSchoolUserPayload);
            setCreatedSecret({
                email: created.user.email,
                tempPassword: created.tempPassword,
            });
            setCopiedTempPassword(false);
            setFormOpen(false);
            toast.success(t("createUser"));
            return;
        }

        if (!activeUser) return;
        await updateMutation.mutateAsync({ id: activeUser.id, payload: payload as UpdateSchoolUserPayload });
        setFormOpen(false);
        toast.success(t("update"));
    }

    async function deactivateUser(user: SchoolUserDto) {
        if (!canManage) throw new Error("Forbidden");
        await deactivateMutation.mutateAsync(user.id);
        setDeactivateOpen(false);
        toast.success(t("deactivateUser"));
    }

    async function copyTempPassword() {
        if (!createdSecret?.tempPassword) return;
        await navigator.clipboard.writeText(createdSecret.tempPassword);
        setCopiedTempPassword(true);
    }

    const totalPages = listQuery.data?.totalPages ?? 1;
    const users = listQuery.data?.items ?? [];
    const mutationError =
        (createMutation.isError && (createMutation.error as Error).message) ||
        (updateMutation.isError && (updateMutation.error as Error).message) ||
        null;

    function roleBadgeLabel(role: SchoolUserRole) {
        if (role === "SCHOOL_ADMIN") return "ADMIN";
        if (role === "ACCOUNTANT") return "ACCOUNTANT";
        return "TEACHER";
    }

    return (
        <div className="mx-auto space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">{t("pageTitle")}</h1>
                    <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
                </div>
                {canManage ? (
                    <Button
                        onClick={() => {
                            setFormMode("create");
                            setActiveUser(null);
                            setFormOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("createUser")}
                    </Button>
                ) : null}
            </div>

            <Card className="bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur supports-backdrop-filter:bg-card/70">
                <CardHeader>
                    <CardTitle className="text-base">{t("searchPlaceholder")}</CardTitle>
                    <CardDescription>{t("subtitle")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-4">
                        <Input
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                        <Select
                            value={role}
                            onValueChange={(value) => {
                                setRole(value as SchoolUserRole | "ALL");
                                setPage(1);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t("role")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t("role")}</SelectItem>
                                <SelectItem value="SCHOOL_ADMIN">ADMIN</SelectItem>
                                <SelectItem value="TEACHER">TEACHER</SelectItem>
                                <SelectItem value="ACCOUNTANT">ACCOUNTANT</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={status}
                            onValueChange={(value) => {
                                setStatus(value as SchoolUserStatus | "ALL");
                                setPage(1);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t("status")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t("status")}</SelectItem>
                                <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                                <SelectItem value="INACTIVE">{t("inactive")}</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center justify-end text-sm text-muted-foreground">
                            Total {listQuery.data?.total ?? 0}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {listQuery.isError ? (
                <div className="flex items-start gap-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive ring-1 ring-destructive/20">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <div className="min-w-0">
                        <div className="font-medium">{t("errorTitle")}</div>
                        <div className="text-destructive/90">{(listQuery.error as Error).message || t("errorDesc")}</div>
                    </div>
                </div>
            ) : null}

            <Card className="bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur supports-backdrop-filter:bg-card/70">
                <CardContent className="p-0">
                    <div className="hidden md:block">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">{t("name")}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t("email")}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t("role")}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listQuery.isLoading || listQuery.isFetching ? (
                                    <>
                                        <DesktopRowSkeleton />
                                        <DesktopRowSkeleton />
                                        <DesktopRowSkeleton />
                                    </>
                                ) : null}
                                {!listQuery.isLoading && !listQuery.isFetching && users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                                            <div className="font-medium">{t("emptyTitle")}</div>
                                            <div className="text-sm">{t("emptyDesc")}</div>
                                        </td>
                                    </tr>
                                ) : null}
                                {users.map((user) => (
                                    <tr key={user.id} className="border-t border-border/30">
                                        <td className="px-4 py-3">{user.name}</td>
                                        <td className="px-4 py-3">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary">{roleBadgeLabel(user.role)}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={user.isActive ? "default" : "secondary"}>
                                                {user.isActive ? t("active") : t("inactive")}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {canManage ? (
                                                <div className="inline-flex flex-wrap justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setFormMode("edit");
                                                            setActiveUser(user);
                                                            setFormOpen(true);
                                                        }}
                                                    >
                                                        {t("editUser")}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setActiveUser(user);
                                                            setResetOpen(true);
                                                        }}
                                                    >
                                                        {t("resetPassword")}
                                                    </Button>
                                                    {user.isActive ? (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={deactivateMutation.isPending}
                                                            onClick={() => {
                                                                setActiveUser(user);
                                                                setDeactivateOpen(true);
                                                            }}
                                                        >
                                                            {t("deactivateUser")}
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Read only</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-3 p-4 md:hidden">
                        {listQuery.isLoading || listQuery.isFetching ? (
                            <>
                                <MobileCardSkeleton />
                                <MobileCardSkeleton />
                                <MobileCardSkeleton />
                            </>
                        ) : null}
                        {!listQuery.isLoading && !listQuery.isFetching && users.length === 0 ? (
                            <div className="rounded border p-6 text-center text-sm text-muted-foreground">
                                <div className="font-medium">{t("emptyTitle")}</div>
                                <div>{t("emptyDesc")}</div>
                            </div>
                        ) : null}
                        {users.map((user) => (
                            <div key={user.id} className="space-y-3 rounded-lg border p-3">
                                <div className="space-y-1">
                                    <p className="font-medium">{user.name}</p>
                                    <p className="break-all text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">{roleBadgeLabel(user.role)}</Badge>
                                    <Badge variant={user.isActive ? "default" : "secondary"}>
                                        {user.isActive ? t("active") : t("inactive")}
                                    </Badge>
                                </div>
                                {canManage ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setFormMode("edit");
                                                setActiveUser(user);
                                                setFormOpen(true);
                                            }}
                                        >
                                            {t("editUser")}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setActiveUser(user);
                                                setResetOpen(true);
                                            }}
                                        >
                                            {t("resetPassword")}
                                        </Button>
                                        {user.isActive ? (
                                            <Button
                                                className="col-span-2"
                                                variant="destructive"
                                                size="sm"
                                                disabled={deactivateMutation.isPending}
                                                onClick={() => {
                                                    setActiveUser(user);
                                                    setDeactivateOpen(true);
                                                }}
                                            >
                                                {t("deactivateUser")}
                                            </Button>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {page} / {totalPages}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                        Prev
                    </Button>
                    <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {createdSecret ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Temporary Password</CardTitle>
                        <CardDescription>{t("passwordGenerated")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div>
                            <b>{t("email")}:</b> {createdSecret.email}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <code className="rounded bg-muted px-2 py-1 text-xs sm:text-sm">{createdSecret.tempPassword}</code>
                            <Button size="sm" variant="outline" onClick={copyTempPassword}>
                                <Copy className="mr-1 h-3.5 w-3.5" />
                                {copiedTempPassword ? t("copied") : t("copy")}
                            </Button>
                        </div>
                        <p className="text-muted-foreground">{t("tempPasswordHint")}</p>
                    </CardContent>
                </Card>
            ) : null}

            <SchoolUserFormDialog
                key={`${formMode}-${activeUser?.id ?? "new"}-${formOpen ? "open" : "closed"}`}
                open={formOpen}
                onOpenChange={setFormOpen}
                mode={formMode}
                initial={activeUser}
                submitting={createMutation.isPending || updateMutation.isPending}
                error={mutationError}
                onSubmit={onSubmitForm}
            />

            <ResetSchoolUserPasswordDialog open={resetOpen} onOpenChange={setResetOpen} user={activeUser} />
            <DeactivateSchoolUserDialog
                open={deactivateOpen}
                onOpenChange={setDeactivateOpen}
                user={activeUser}
                pending={deactivateMutation.isPending}
                onConfirm={deactivateUser}
            />
        </div>
    );
}

function DesktopRowSkeleton() {
    return (
        <tr className="border-t border-border/30">
            <td className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
            </td>
            <td className="px-4 py-3">
                <Skeleton className="h-4 w-40" />
            </td>
            <td className="px-4 py-3">
                <Skeleton className="h-4 w-28" />
            </td>
            <td className="px-4 py-3">
                <Skeleton className="h-6 w-20" />
            </td>
            <td className="px-4 py-3">
                <div className="ml-auto flex justify-end gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-24" />
                </div>
            </td>
        </tr>
    );
}

function MobileCardSkeleton() {
    return (
        <div className="space-y-3 rounded-lg border p-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-44" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
    );
}
