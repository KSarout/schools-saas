"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { can, SchoolPermissions } from "@/features/school-auth/rbac/schoolRbac";
import { useSchoolMe } from "@/features/school-auth/hooks/useSchoolAuth";
import {
    useAcademicYearsList,
    useCreateAcademicYear,
    useDeactivateAcademicYear,
    useSetCurrentAcademicYear,
    useUpdateAcademicYear,
} from "@/features/academic-years/hooks/useAcademicYears";
import type {
    AcademicYearDto,
    CreateAcademicYearPayload,
    UpdateAcademicYearPayload,
} from "@/features/academic-years/api/academicYears.dto";
import { AcademicYearFormDialog } from "@/features/academic-years/components/AcademicYearFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type FormMode = "create" | "edit";

export default function AcademicYearsPageView() {
    const t = useTranslations("school.settings.academicYears");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 350);
    const [page, setPage] = useState(1);
    const limit = 10;

    const params = useMemo(
        () => ({ q: debouncedSearch.trim() || undefined, page, limit }),
        [debouncedSearch, page]
    );

    const listQuery = useAcademicYearsList(params);
    const createMutation = useCreateAcademicYear();
    const updateMutation = useUpdateAcademicYear();
    const deleteMutation = useDeactivateAcademicYear();
    const setCurrentMutation = useSetCurrentAcademicYear();

    const meQuery = useSchoolMe();
    const canManage = can(meQuery.data?.user?.role, SchoolPermissions.manageUsers);

    const [mode, setMode] = useState<FormMode>("create");
    const [activeItem, setActiveItem] = useState<AcademicYearDto | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [setCurrentOpen, setSetCurrentOpen] = useState(false);

    const totalPages = listQuery.data?.totalPages ?? 1;
    const items = listQuery.data?.items ?? [];

    async function onSubmit(payload: CreateAcademicYearPayload | UpdateAcademicYearPayload) {
        if (mode === "create") {
            await createMutation.mutateAsync(payload as CreateAcademicYearPayload);
            setFormOpen(false);
            toast.success(t("create"));
            return;
        }

        if (!activeItem) return;
        await updateMutation.mutateAsync({ id: activeItem.id, payload: payload as UpdateAcademicYearPayload });
        setFormOpen(false);
        toast.success(t("update"));
    }

    return (
        <div className="mx-auto space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">{t("pageTitle")}</h1>
                    <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
                </div>
                {canManage ? (
                    <Button onClick={() => { setMode("create"); setActiveItem(null); setFormOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("create")}
                    </Button>
                ) : null}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t("searchPlaceholder")}</CardTitle>
                    <CardDescription>{t("subtitle")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Input
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                        />
                        <div className="md:col-span-2 flex items-center justify-end text-sm text-muted-foreground">
                            Total {listQuery.data?.total ?? 0}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <div className="hidden md:block">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">{t("name")}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t("code")}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t("startDate")}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t("endDate")}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t("isActive")}</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(listQuery.isLoading || listQuery.isFetching) ? (
                                    <tr><td colSpan={6} className="p-4"><Skeleton className="h-8 w-full" /></td></tr>
                                ) : null}
                                {!listQuery.isLoading && !listQuery.isFetching && items.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><div className="font-medium">{t("emptyTitle")}</div><div>{t("emptyDesc")}</div></td></tr>
                                ) : null}
                                {items.map((item) => (
                                    <tr key={item.id} className="border-t border-border/30">
                                        <td className="px-4 py-3">{item.name}</td>
                                        <td className="px-4 py-3">{item.code}</td>
                                        <td className="px-4 py-3">{item.startDate.slice(0, 10)}</td>
                                        <td className="px-4 py-3">{item.endDate.slice(0, 10)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? t("active") : t("inactive")}</Badge>
                                                {item.isCurrent ? <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" />{t("current")}</Badge> : null}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {canManage ? (
                                                <div className="inline-flex flex-wrap justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => { setMode("edit"); setActiveItem(item); setFormOpen(true); }}>{t("edit")}</Button>
                                                    {!item.isCurrent ? (
                                                        <Button variant="outline" size="sm" onClick={() => { setActiveItem(item); setSetCurrentOpen(true); }}>{t("setCurrent")}</Button>
                                                    ) : null}
                                                    {item.isActive ? (
                                                        <Button variant="destructive" size="sm" onClick={() => { setActiveItem(item); setDeleteOpen(true); }}>{t("delete")}</Button>
                                                    ) : null}
                                                </div>
                                            ) : <span className="text-muted-foreground">Read only</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-3 p-4 md:hidden">
                        {items.map((item) => (
                            <div key={item.id} className="space-y-2 rounded-lg border p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium">{item.name}</p>
                                    <div className="flex gap-1">
                                        <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? t("active") : t("inactive")}</Badge>
                                        {item.isCurrent ? <Badge variant="secondary">{t("current")}</Badge> : null}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">{item.code}</p>
                                <p className="text-xs text-muted-foreground">{item.startDate.slice(0, 10)} - {item.endDate.slice(0, 10)}</p>
                                {canManage ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" onClick={() => { setMode("edit"); setActiveItem(item); setFormOpen(true); }}>{t("edit")}</Button>
                                        {!item.isCurrent ? <Button variant="outline" size="sm" onClick={() => { setActiveItem(item); setSetCurrentOpen(true); }}>{t("setCurrent")}</Button> : null}
                                        {item.isActive ? <Button className="col-span-2" variant="destructive" size="sm" onClick={() => { setActiveItem(item); setDeleteOpen(true); }}>{t("delete")}</Button> : null}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                        {!listQuery.isLoading && !listQuery.isFetching && items.length === 0 ? (
                            <div className="rounded border p-6 text-center text-sm text-muted-foreground"><div className="font-medium">{t("emptyTitle")}</div><div>{t("emptyDesc")}</div></div>
                        ) : null}
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Prev</Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Next</Button>
            </div>

            <AcademicYearFormDialog
                key={`${mode}:${activeItem?.id ?? "new"}:${formOpen ? "open" : "closed"}`}
                open={formOpen}
                onOpenChange={setFormOpen}
                mode={mode}
                initial={activeItem}
                submitting={createMutation.isPending || updateMutation.isPending}
                error={(createMutation.error as Error)?.message || (updateMutation.error as Error)?.message || null}
                onSubmit={onSubmit}
            />

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{t("confirmDeleteTitle")}</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">{t("confirmDeleteDesc")}</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t("cancel")}</Button>
                        <Button variant="destructive" disabled={!activeItem || deleteMutation.isPending} onClick={async () => {
                            if (!activeItem) return;
                            await deleteMutation.mutateAsync(activeItem.id);
                            setDeleteOpen(false);
                            toast.success(t("delete"));
                        }}>{t("delete")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={setCurrentOpen} onOpenChange={setSetCurrentOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{t("confirmSetCurrentTitle")}</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">{t("confirmSetCurrentDesc")}</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSetCurrentOpen(false)}>{t("cancel")}</Button>
                        <Button disabled={!activeItem || setCurrentMutation.isPending} onClick={async () => {
                            if (!activeItem) return;
                            await setCurrentMutation.mutateAsync(activeItem.id);
                            setSetCurrentOpen(false);
                            toast.success(t("setCurrent"));
                        }}>{t("setCurrent")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
