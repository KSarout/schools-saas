"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { EnrollmentListItem } from "@/features/enrollment/dto/enrollment.dto";

function formatDate(value: string | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
}

function statusVariant(status: EnrollmentListItem["enrollment"]["status"]) {
    if (status === "ACTIVE") return "default" as const;
    return "secondary" as const;
}

export function EnrollmentTable({
    items,
    loading,
    canManage,
    onTransfer,
    onPromote,
    onWithdraw,
}: {
    items: EnrollmentListItem[];
    loading: boolean;
    canManage: boolean;
    onTransfer: (item: EnrollmentListItem) => void;
    onPromote: (item: EnrollmentListItem) => void;
    onWithdraw: (item: EnrollmentListItem) => void;
}) {
    return (
        <>
            <div className="hidden md:block">
                <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Student</th>
                            <th className="px-4 py-3 text-left font-medium">Academic Year</th>
                            <th className="px-4 py-3 text-left font-medium">Class</th>
                            <th className="px-4 py-3 text-left font-medium">Section</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-left font-medium">Start Date</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td className="p-4" colSpan={7}>
                                    <Skeleton className="h-8 w-full" />
                                </td>
                            </tr>
                        ) : null}
                        {!loading && items.length === 0 ? (
                            <tr>
                                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={7}>
                                    No enrollments found.
                                </td>
                            </tr>
                        ) : null}
                        {items.map((item) => (
                            <tr key={item.enrollment.id} className="border-t border-border/30">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{item.student.fullName}</div>
                                    <div className="text-xs text-muted-foreground">{item.student.studentCode}</div>
                                </td>
                                <td className="px-4 py-3">{item.academicYear.name}</td>
                                <td className="px-4 py-3">{item.class.name}</td>
                                <td className="px-4 py-3">{item.section.name}</td>
                                <td className="px-4 py-3">
                                    <Badge variant={statusVariant(item.enrollment.status)}>{item.enrollment.status}</Badge>
                                </td>
                                <td className="px-4 py-3">{formatDate(item.enrollment.startDate)}</td>
                                <td className="px-4 py-3 text-right">
                                    {canManage ? (
                                        <div className="inline-flex flex-wrap justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={item.enrollment.status !== "ACTIVE"}
                                                onClick={() => onTransfer(item)}
                                            >
                                                Transfer
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={item.enrollment.status !== "ACTIVE"}
                                                onClick={() => onPromote(item)}
                                            >
                                                Promote
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={item.enrollment.status !== "ACTIVE"}
                                                onClick={() => onWithdraw(item)}
                                            >
                                                Withdraw
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Read only</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-3 md:hidden">
                {loading ? <Skeleton className="h-20 w-full" /> : null}
                {!loading && items.length === 0 ? <p className="text-sm text-muted-foreground">No enrollments found.</p> : null}
                {items.map((item) => (
                    <div key={item.enrollment.id} className="space-y-2 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="font-medium">{item.student.fullName}</p>
                                <p className="text-xs text-muted-foreground">{item.student.studentCode}</p>
                            </div>
                            <Badge variant={statusVariant(item.enrollment.status)}>{item.enrollment.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {item.academicYear.name} • {item.class.name} • {item.section.name}
                        </p>
                        <p className="text-xs text-muted-foreground">Start: {formatDate(item.enrollment.startDate)}</p>
                        {canManage ? (
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={item.enrollment.status !== "ACTIVE"}
                                    onClick={() => onTransfer(item)}
                                >
                                    Transfer
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={item.enrollment.status !== "ACTIVE"}
                                    onClick={() => onPromote(item)}
                                >
                                    Promote
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={item.enrollment.status !== "ACTIVE"}
                                    onClick={() => onWithdraw(item)}
                                >
                                    Withdraw
                                </Button>
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
        </>
    );
}
