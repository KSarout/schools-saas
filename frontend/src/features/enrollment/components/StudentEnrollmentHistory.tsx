"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAcademicYearsList } from "@/features/academic-years/hooks/useAcademicYears";
import { useClassesList } from "@/features/classes/hooks/useClasses";
import { useSectionsList } from "@/features/sections/hooks/useSections";
import { AssignDialog } from "@/features/enrollment/components/AssignDialog";
import { PromoteDialog } from "@/features/enrollment/components/PromoteDialog";
import { TransferDialog } from "@/features/enrollment/components/TransferDialog";
import { WithdrawDialog } from "@/features/enrollment/components/WithdrawDialog";
import type {
    AssignEnrollmentPayload,
    EnrollmentListItem,
    PromoteEnrollmentPayload,
    TransferEnrollmentPayload,
    WithdrawEnrollmentPayload,
} from "@/features/enrollment/dto/enrollment.dto";
import { useAssignEnrollment } from "@/features/enrollment/hooks/useAssignEnrollment";
import { usePromoteEnrollment } from "@/features/enrollment/hooks/usePromoteEnrollment";
import { useStudentEnrollmentHistory } from "@/features/enrollment/hooks/useEnrollments";
import { useTransferEnrollment } from "@/features/enrollment/hooks/useTransferEnrollment";
import { useWithdrawEnrollment } from "@/features/enrollment/hooks/useWithdrawEnrollment";

function formatDate(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
}

export function StudentEnrollmentHistory({
    studentId,
    studentName,
    studentCode,
    canManage,
}: {
    studentId: string;
    studentName: string;
    studentCode: string;
    canManage: boolean;
}) {
    const historyQuery = useStudentEnrollmentHistory(studentId);
    const academicYearsQuery = useAcademicYearsList({ page: 1, limit: 50, isActive: true });
    const classesQuery = useClassesList({ page: 1, limit: 50, isActive: true });
    const sectionsQuery = useSectionsList({ page: 1, limit: 50, isActive: true });

    const assignMutation = useAssignEnrollment();
    const transferMutation = useTransferEnrollment();
    const promoteMutation = usePromoteEnrollment();
    const withdrawMutation = useWithdrawEnrollment();

    const [assignOpen, setAssignOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [promoteOpen, setPromoteOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentListItem | null>(null);

    const historyItems = useMemo(
        () => historyQuery.data?.items ?? [],
        [historyQuery.data?.items]
    );

    const activeEnrollment = useMemo(() => {
        const active = historyItems.find((item) => item.status === "ACTIVE");
        if (!active) return null;

        return {
            enrollment: {
                id: active.id,
                status: active.status,
                startDate: active.startDate,
                endDate: active.endDate,
                note: active.note,
            },
            student: {
                id: studentId,
                fullName: studentName,
                studentCode,
            },
            academicYear: {
                id: active.academicYear.id,
                name: active.academicYear.name,
            },
            class: {
                id: active.class.id,
                name: active.class.name,
            },
            section: {
                id: active.section.id,
                name: active.section.name,
            },
        } as EnrollmentListItem;
    }, [historyItems, studentCode, studentId, studentName]);

    const currentAcademicYear = useMemo(
        () => (academicYearsQuery.data?.items ?? []).find((year) => year.isCurrent),
        [academicYearsQuery.data?.items]
    );

    const hasActiveInCurrentYear = !!currentAcademicYear && historyItems.some(
        (item) => item.status === "ACTIVE" && item.academicYear.id === currentAcademicYear.id
    );

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

    async function submitAssign(payload: AssignEnrollmentPayload) {
        await assignMutation.mutateAsync(payload);
        setAssignOpen(false);
        toast.success("Enrollment assigned");
    }

    async function submitTransfer(payload: TransferEnrollmentPayload) {
        await transferMutation.mutateAsync(payload);
        setTransferOpen(false);
        setSelectedEnrollment(null);
        toast.success("Enrollment transferred");
    }

    async function submitPromote(payload: PromoteEnrollmentPayload) {
        await promoteMutation.mutateAsync(payload);
        setPromoteOpen(false);
        setSelectedEnrollment(null);
        toast.success("Enrollment promoted");
    }

    async function submitWithdraw(payload: WithdrawEnrollmentPayload) {
        await withdrawMutation.mutateAsync(payload);
        setWithdrawOpen(false);
        setSelectedEnrollment(null);
        toast.success("Enrollment withdrawn");
    }

    return (
        <Card className="bg-card/80 ring-1 ring-border/40">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Enrollment History</CardTitle>
                {canManage && !hasActiveInCurrentYear ? (
                    <Button onClick={() => setAssignOpen(true)} size="sm">
                        Assign
                    </Button>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
                {historyQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading history...</p> : null}
                {historyQuery.isError ? (
                    <p className="text-sm text-destructive">{(historyQuery.error as Error).message}</p>
                ) : null}

                {!historyQuery.isLoading && !historyQuery.isError ? (
                    <>
                        <div className="hidden md:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Academic Year</th>
                                        <th className="px-3 py-2 text-left font-medium">Class</th>
                                        <th className="px-3 py-2 text-left font-medium">Section</th>
                                        <th className="px-3 py-2 text-left font-medium">Status</th>
                                        <th className="px-3 py-2 text-left font-medium">Start Date</th>
                                        <th className="px-3 py-2 text-left font-medium">End Date</th>
                                        <th className="px-3 py-2 text-left font-medium">Note</th>
                                        <th className="px-3 py-2 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                                                No enrollment history.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {historyItems.map((item) => {
                                        const rowEnrollment: EnrollmentListItem = {
                                            enrollment: {
                                                id: item.id,
                                                status: item.status,
                                                startDate: item.startDate,
                                                endDate: item.endDate,
                                                note: item.note,
                                            },
                                            student: {
                                                id: studentId,
                                                fullName: studentName,
                                                studentCode,
                                            },
                                            academicYear: {
                                                id: item.academicYear.id,
                                                name: item.academicYear.name,
                                            },
                                            class: {
                                                id: item.class.id,
                                                name: item.class.name,
                                            },
                                            section: {
                                                id: item.section.id,
                                                name: item.section.name,
                                            },
                                        };

                                        return (
                                            <tr key={item.id} className="border-t border-border/30">
                                                <td className="px-3 py-2">{item.academicYear.name}</td>
                                                <td className="px-3 py-2">{item.class.name}</td>
                                                <td className="px-3 py-2">{item.section.name}</td>
                                                <td className="px-3 py-2">
                                                    <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status}</Badge>
                                                </td>
                                                <td className="px-3 py-2">{formatDate(item.startDate)}</td>
                                                <td className="px-3 py-2">{formatDate(item.endDate)}</td>
                                                <td className="px-3 py-2">{item.note || "-"}</td>
                                                <td className="px-3 py-2 text-right">
                                                    {canManage && item.status === "ACTIVE" ? (
                                                        <div className="inline-flex flex-wrap justify-end gap-2">
                                                            <Button size="sm" variant="outline" onClick={() => {
                                                                setSelectedEnrollment(rowEnrollment);
                                                                setTransferOpen(true);
                                                            }}>
                                                                Transfer
                                                            </Button>
                                                            <Button size="sm" variant="outline" onClick={() => {
                                                                setSelectedEnrollment(rowEnrollment);
                                                                setPromoteOpen(true);
                                                            }}>
                                                                Promote
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => {
                                                                setSelectedEnrollment(rowEnrollment);
                                                                setWithdrawOpen(true);
                                                            }}>
                                                                Withdraw
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3 md:hidden">
                            {historyItems.length === 0 ? <p className="text-sm text-muted-foreground">No enrollment history.</p> : null}
                            {historyItems.map((item) => (
                                <div key={item.id} className="space-y-2 rounded-lg border p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">{item.academicYear.name}</p>
                                        <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{item.class.name} • {item.section.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(item.startDate)} - {formatDate(item.endDate)}</p>
                                    {item.note ? <p className="text-xs text-muted-foreground">{item.note}</p> : null}
                                </div>
                            ))}
                        </div>
                    </>
                ) : null}

                {canManage && activeEnrollment ? (
                    <div className="flex flex-wrap gap-2 border-t pt-3">
                        <Button size="sm" variant="outline" onClick={() => {
                            setSelectedEnrollment(activeEnrollment);
                            setTransferOpen(true);
                        }}>
                            Transfer Active Enrollment
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                            setSelectedEnrollment(activeEnrollment);
                            setPromoteOpen(true);
                        }}>
                            Promote Active Enrollment
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                            setSelectedEnrollment(activeEnrollment);
                            setWithdrawOpen(true);
                        }}>
                            Withdraw Active Enrollment
                        </Button>
                    </div>
                ) : null}
            </CardContent>

            <AssignDialog
                key={`assign:${studentId}:${assignOpen ? "open" : "closed"}`}
                open={assignOpen}
                onOpenChange={setAssignOpen}
                students={[{ id: studentId, name: studentName, studentCode }]}
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
                    if (!next) {
                        setTransferOpen(false);
                        setSelectedEnrollment(null);
                    }
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
                    if (!next) {
                        setPromoteOpen(false);
                        setSelectedEnrollment(null);
                    }
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
                    if (!next) {
                        setWithdrawOpen(false);
                        setSelectedEnrollment(null);
                    }
                }}
                enrollment={selectedEnrollment}
                submitting={withdrawMutation.isPending}
                error={(withdrawMutation.error as Error | undefined)?.message ?? null}
                onSubmit={submitWithdraw}
            />
        </Card>
    );
}
