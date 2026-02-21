"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { can, SchoolPermissions } from "@/features/school-auth/rbac/schoolRbac";
import { useSchoolMe } from "@/features/school-auth/hooks/useSchoolAuth";
import { useSchoolUsersList } from "@/features/school-users/hooks/useSchoolUsers";
import { useAcademicYearsList } from "@/features/academic-years/hooks/useAcademicYears";
import { useClassesList, useCreateClass, useDeactivateClass, useUpdateClass } from "@/features/classes/hooks/useClasses";
import type { ClassDto, CreateClassPayload, UpdateClassPayload } from "@/features/classes/api/classes.dto";
import { ClassFormDialog } from "@/features/classes/components/ClassFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type FormMode = "create" | "edit";

export default function ClassesPageView() {
    const t = useTranslations("school.settings.classes");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 350);
    const [page, setPage] = useState(1);
    const [academicYearFilter, setAcademicYearFilter] = useState<string>("ALL");
    const limit = 10;

    const params = useMemo(
        () => ({
            q: debouncedSearch.trim() || undefined,
            academicYearId: academicYearFilter === "ALL" ? undefined : academicYearFilter,
            page,
            limit,
        }),
        [debouncedSearch, academicYearFilter, page]
    );

    const listQuery = useClassesList(params);
    const createMutation = useCreateClass();
    const updateMutation = useUpdateClass();
    const deleteMutation = useDeactivateClass();
    const meQuery = useSchoolMe();
    const canManage = can(meQuery.data?.user?.role, SchoolPermissions.manageUsers);

    const yearsQuery = useAcademicYearsList({ page: 1, limit: 50 });
    const teachersQuery = useSchoolUsersList({ role: "TEACHER", status: "ACTIVE", page: 1, limit: 50 });

    const yearOptions = (yearsQuery.data?.items ?? []).map((item) => ({ id: item.id, label: `${item.name} (${item.code})` }));
    const teacherOptions = (teachersQuery.data?.items ?? []).map((item) => ({ id: item.id, label: item.name }));

    const [formOpen, setFormOpen] = useState(false);
    const [mode, setMode] = useState<FormMode>("create");
    const [activeItem, setActiveItem] = useState<ClassDto | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const totalPages = listQuery.data?.totalPages ?? 1;
    const items = listQuery.data?.items ?? [];

    async function onSubmit(payload: CreateClassPayload | UpdateClassPayload) {
        if (mode === "create") {
            await createMutation.mutateAsync(payload as CreateClassPayload);
            setFormOpen(false);
            toast.success(t("create"));
            return;
        }
        if (!activeItem) return;
        await updateMutation.mutateAsync({ id: activeItem.id, payload: payload as UpdateClassPayload });
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
                    <div className="grid gap-3 md:grid-cols-4">
                        <Input
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                        />
                        <Select value={academicYearFilter} onValueChange={(value) => { setAcademicYearFilter(value); setPage(1); }}>
                            <SelectTrigger><SelectValue placeholder={t("academicYear")} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t("academicYear")}</SelectItem>
                                {yearOptions.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="md:col-span-2 flex items-center justify-end text-sm text-muted-foreground">Total {listQuery.data?.total ?? 0}</div>
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
                                    <th className="px-4 py-3 text-left font-medium">{t("level")}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t("capacity")}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t("isActive")}</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(listQuery.isLoading || listQuery.isFetching) ? <tr><td colSpan={6} className="p-4"><Skeleton className="h-8 w-full" /></td></tr> : null}
                                {!listQuery.isLoading && !listQuery.isFetching && items.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><div className="font-medium">{t("emptyTitle")}</div><div>{t("emptyDesc")}</div></td></tr> : null}
                                {items.map((item) => (
                                    <tr key={item.id} className="border-t border-border/30">
                                        <td className="px-4 py-3">{item.name}</td>
                                        <td className="px-4 py-3">{item.code}</td>
                                        <td className="px-4 py-3">{item.level}</td>
                                        <td className="px-4 py-3">{item.capacity ?? "-"}</td>
                                        <td className="px-4 py-3"><Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? t("active") : t("inactive")}</Badge></td>
                                        <td className="px-4 py-3 text-right">
                                            {canManage ? (
                                                <div className="inline-flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => { setMode("edit"); setActiveItem(item); setFormOpen(true); }}>{t("edit")}</Button>
                                                    {item.isActive ? <Button variant="destructive" size="sm" onClick={() => { setActiveItem(item); setDeleteOpen(true); }}>{t("delete")}</Button> : null}
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
                                    <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? t("active") : t("inactive")}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{item.code} • {item.level}</p>
                                <p className="text-xs text-muted-foreground">{t("capacity")}: {item.capacity ?? "-"}</p>
                                {canManage ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" onClick={() => { setMode("edit"); setActiveItem(item); setFormOpen(true); }}>{t("edit")}</Button>
                                        {item.isActive ? <Button variant="destructive" size="sm" onClick={() => { setActiveItem(item); setDeleteOpen(true); }}>{t("delete")}</Button> : null}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Prev</Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Next</Button>
            </div>

            <ClassFormDialog
                key={`${mode}:${activeItem?.id ?? "new"}:${formOpen ? "open" : "closed"}`}
                open={formOpen}
                onOpenChange={setFormOpen}
                mode={mode}
                initial={activeItem}
                academicYearOptions={yearOptions}
                teacherOptions={teacherOptions}
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
        </div>
    );
}
