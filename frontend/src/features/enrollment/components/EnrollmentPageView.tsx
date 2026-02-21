"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useSchoolMe } from "@/features/school-auth/hooks/useSchoolAuth";
import { useAcademicYearsList } from "@/features/academic-years/hooks/useAcademicYears";
import { useClassesList } from "@/features/classes/hooks/useClasses";
import { useSectionsList } from "@/features/sections/hooks/useSections";
import { useStudentList } from "@/features/students/hooks/useStudents";
import { EnrollmentFiltersBar } from "@/features/enrollment/components/EnrollmentFiltersBar";
import { EnrollmentTable } from "@/features/enrollment/components/EnrollmentTable";
import { AssignDialog } from "@/features/enrollment/components/AssignDialog";
import { TransferDialog } from "@/features/enrollment/components/TransferDialog";
import { PromoteDialog } from "@/features/enrollment/components/PromoteDialog";
import { WithdrawDialog } from "@/features/enrollment/components/WithdrawDialog";
import { useEnrollments } from "@/features/enrollment/hooks/useEnrollments";
import { useAssignEnrollment } from "@/features/enrollment/hooks/useAssignEnrollment";
import { useTransferEnrollment } from "@/features/enrollment/hooks/useTransferEnrollment";
import { usePromoteEnrollment } from "@/features/enrollment/hooks/usePromoteEnrollment";
import { useWithdrawEnrollment } from "@/features/enrollment/hooks/useWithdrawEnrollment";
import type {
    AssignEnrollmentPayload,
    EnrollmentStatus,
    PromoteEnrollmentPayload,
    TransferEnrollmentPayload,
    WithdrawEnrollmentPayload,
} from "@/features/enrollment/dto/enrollment.dto";
import { useEnrollmentUiStore } from "@/features/enrollment/store/enrollment.ui.store";

export default function EnrollmentPageView() {
    const t = useTranslations("school.enrollment");
    const [q, setQ] = useState("");
    const qDebounced = useDebouncedValue(q, 350);
    const [academicYearFilter, setAcademicYearFilter] = useState<string>("ALL");
    const [classFilter, setClassFilter] = useState<string>("ALL");
    const [sectionFilter, setSectionFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "ALL">("ACTIVE");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const listParams = useMemo(
        () => ({
            q: qDebounced.trim() || undefined,
            academicYearId: academicYearFilter === "ALL" ? undefined : academicYearFilter,
            classId: classFilter === "ALL" ? undefined : classFilter,
            sectionId: sectionFilter === "ALL" ? undefined : sectionFilter,
            status: statusFilter === "ALL" ? undefined : statusFilter,
            page,
            limit,
        }),
        [qDebounced, academicYearFilter, classFilter, sectionFilter, statusFilter, page, limit]
    );

    const meQuery = useSchoolMe();
    const canManage = meQuery.data?.user.role === "SCHOOL_ADMIN";

    const enrollmentListQuery = useEnrollments(listParams);

    const academicYearsQuery = useAcademicYearsList({ page: 1, limit: 50, isActive: true });
    const classesQuery = useClassesList({ page: 1, limit: 50, isActive: true });
    const sectionsQuery = useSectionsList({ page: 1, limit: 50, isActive: true });
    const studentsQuery = useStudentList({ page: 1, limit: 50, q: undefined });

    const assignMutation = useAssignEnrollment();
    const transferMutation = useTransferEnrollment();
    const promoteMutation = usePromoteEnrollment();
    const withdrawMutation = useWithdrawEnrollment();

    const {
        assignOpen,
        transferOpen,
        promoteOpen,
        withdrawOpen,
        selectedEnrollment,
        openAssign,
        openTransfer,
        openPromote,
        openWithdraw,
        closeAssign,
        closeTransfer,
        closePromote,
        closeWithdraw,
    } = useEnrollmentUiStore();

    const academicYearOptions = (academicYearsQuery.data?.items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
    }));

    const classOptions = (classesQuery.data?.items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        academicYearId: item.academicYearId,
    }));

    const sectionOptions = (sectionsQuery.data?.items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        classId: item.classId,
    }));

    const studentOptions = (studentsQuery.data?.items ?? []).map((item) => ({
        id: item.id,
        name: `${item.firstName} ${item.lastName}`.trim(),
        studentCode: item.studentId,
    }));

    const totalPages = enrollmentListQuery.data?.totalPages ?? 1;

    async function submitAssign(payload: AssignEnrollmentPayload) {
        await assignMutation.mutateAsync(payload);
        closeAssign();
        toast.success("Enrollment assigned");
    }

    async function submitTransfer(payload: TransferEnrollmentPayload) {
        await transferMutation.mutateAsync(payload);
        closeTransfer();
        toast.success("Enrollment transferred");
    }

    async function submitPromote(payload: PromoteEnrollmentPayload) {
        await promoteMutation.mutateAsync(payload);
        closePromote();
        toast.success("Enrollment promoted");
    }

    async function submitWithdraw(payload: WithdrawEnrollmentPayload) {
        await withdrawMutation.mutateAsync(payload);
        closeWithdraw();
        toast.success("Enrollment withdrawn");
    }

    return (
        <div className="mx-auto space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">{t("pageTitle")}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>
                {canManage ? (
                    <Button onClick={openAssign}>
                        <Plus className="mr-2 h-4 w-4" />
                        Assign Enrollment
                    </Button>
                ) : null}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Filters</CardTitle>
                    <CardDescription>Search and narrow enrollment records.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EnrollmentFiltersBar
                        q={q}
                        onQChange={(value) => {
                            setQ(value);
                            setPage(1);
                        }}
                        academicYearId={academicYearFilter}
                        onAcademicYearChange={(value) => {
                            setAcademicYearFilter(value);
                            setClassFilter("ALL");
                            setSectionFilter("ALL");
                            setPage(1);
                        }}
                        classId={classFilter}
                        onClassChange={(value) => {
                            setClassFilter(value);
                            setSectionFilter("ALL");
                            setPage(1);
                        }}
                        sectionId={sectionFilter}
                        onSectionChange={(value) => {
                            setSectionFilter(value);
                            setPage(1);
                        }}
                        status={statusFilter}
                        onStatusChange={(value) => {
                            setStatusFilter(value);
                            setPage(1);
                        }}
                        academicYearOptions={academicYearOptions}
                        classOptions={classOptions.filter((item) => academicYearFilter === "ALL" || item.academicYearId === academicYearFilter)}
                        sectionOptions={sectionOptions.filter((item) => classFilter === "ALL" || item.classId === classFilter)}
                        limit={limit}
                        onLimitChange={(value) => {
                            setLimit(value);
                            setPage(1);
                        }}
                        total={enrollmentListQuery.data?.total ?? 0}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0 md:p-0">
                    <EnrollmentTable
                        items={enrollmentListQuery.data?.items ?? []}
                        loading={enrollmentListQuery.isLoading || enrollmentListQuery.isFetching}
                        canManage={canManage}
                        onTransfer={openTransfer}
                        onPromote={openPromote}
                        onWithdraw={openWithdraw}
                    />
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                    Prev
                </Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                >
                    Next
                </Button>
            </div>

            <AssignDialog
                key={`assign:${assignOpen ? "open" : "closed"}`}
                open={assignOpen}
                onOpenChange={(next) => (next ? openAssign() : closeAssign())}
                students={studentOptions}
                academicYears={academicYearOptions}
                classes={classOptions}
                sections={sectionOptions}
                submitting={assignMutation.isPending}
                error={(assignMutation.error as Error | undefined)?.message ?? null}
                onSubmit={submitAssign}
            />

            <TransferDialog
                key={`transfer:${selectedEnrollment?.enrollment.id ?? "none"}:${transferOpen ? "open" : "closed"}`}
                open={transferOpen}
                onOpenChange={(next) => {
                    if (!next) closeTransfer();
                }}
                enrollment={selectedEnrollment}
                classes={classOptions}
                sections={sectionOptions}
                submitting={transferMutation.isPending}
                error={(transferMutation.error as Error | undefined)?.message ?? null}
                onSubmit={submitTransfer}
            />

            <PromoteDialog
                key={`promote:${selectedEnrollment?.enrollment.id ?? "none"}:${promoteOpen ? "open" : "closed"}`}
                open={promoteOpen}
                onOpenChange={(next) => {
                    if (!next) closePromote();
                }}
                enrollment={selectedEnrollment}
                academicYears={academicYearOptions}
                classes={classOptions}
                sections={sectionOptions}
                submitting={promoteMutation.isPending}
                error={(promoteMutation.error as Error | undefined)?.message ?? null}
                onSubmit={submitPromote}
            />

            <WithdrawDialog
                key={`withdraw:${selectedEnrollment?.enrollment.id ?? "none"}:${withdrawOpen ? "open" : "closed"}`}
                open={withdrawOpen}
                onOpenChange={(next) => {
                    if (!next) closeWithdraw();
                }}
                enrollment={selectedEnrollment}
                submitting={withdrawMutation.isPending}
                error={(withdrawMutation.error as Error | undefined)?.message ?? null}
                onSubmit={submitWithdraw}
            />
        </div>
    );
}
