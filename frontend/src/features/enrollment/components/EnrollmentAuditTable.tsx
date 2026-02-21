"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useEnrollmentAuditLogs } from "@/features/enrollment/hooks/useEnrollments";
import type { EnrollmentAuditAction } from "@/features/enrollment/dto/enrollment.dto";

type StudentOption = { id: string; name: string; studentCode: string };

const actionOptions: Array<{ value: EnrollmentAuditAction | "ALL"; label: string }> = [
    { value: "ALL", label: "All actions" },
    { value: "ASSIGN", label: "Assign" },
    { value: "TRANSFER", label: "Transfer" },
    { value: "PROMOTE", label: "Promote" },
    { value: "WITHDRAW", label: "Withdraw" },
];

export function EnrollmentAuditTable({ students }: { students: StudentOption[] }) {
    const [studentId, setStudentId] = useState<string>("ALL");
    const [action, setAction] = useState<EnrollmentAuditAction | "ALL">("ALL");
    const [from, setFrom] = useState<string>("");
    const [to, setTo] = useState<string>("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const debouncedFrom = useDebouncedValue(from, 300);
    const debouncedTo = useDebouncedValue(to, 300);

    const params = useMemo(
        () => ({
            page,
            limit,
            studentId: studentId === "ALL" ? undefined : studentId,
            action: action === "ALL" ? undefined : action,
            from: debouncedFrom || undefined,
            to: debouncedTo || undefined,
        }),
        [page, limit, studentId, action, debouncedFrom, debouncedTo]
    );

    const query = useEnrollmentAuditLogs(params, true);
    const items = query.data?.items ?? [];
    const totalPages = query.data?.totalPages ?? 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Enrollment Audit</CardTitle>
                <CardDescription>Recent enrollment actions for compliance and traceability.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <Select
                        value={studentId}
                        onValueChange={(value) => {
                            setStudentId(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Student" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All students</SelectItem>
                            {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                    {student.name} ({student.studentCode})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={action}
                        onValueChange={(value) => {
                            setAction(value as EnrollmentAuditAction | "ALL");
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Action" />
                        </SelectTrigger>
                        <SelectContent>
                            {actionOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        type="date"
                        value={from}
                        onChange={(event) => {
                            setFrom(event.target.value);
                            setPage(1);
                        }}
                    />
                    <Input
                        type="date"
                        value={to}
                        onChange={(event) => {
                            setTo(event.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">When</th>
                                <th className="px-3 py-2 text-left font-medium">Action</th>
                                <th className="px-3 py-2 text-left font-medium">Student</th>
                                <th className="px-3 py-2 text-left font-medium">Actor</th>
                                <th className="px-3 py-2 text-left font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.isLoading ? (
                                <tr>
                                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                                        Loading audit logs...
                                    </td>
                                </tr>
                            ) : null}
                            {!query.isLoading && items.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                                        No audit logs found.
                                    </td>
                                </tr>
                            ) : null}
                            {items.map((item) => (
                                <tr key={item.id} className="border-t border-border/40">
                                    <td className="px-3 py-2">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
                                    <td className="px-3 py-2">{item.action}</td>
                                    <td className="px-3 py-2">{item.studentId}</td>
                                    <td className="px-3 py-2">{item.actorUserId}</td>
                                    <td className="px-3 py-2">
                                        <span className="text-xs text-muted-foreground">
                                            from AY:{item.from?.academicYearId ?? "-"} / C:{item.from?.classId ?? "-"} / S:{item.from?.sectionId ?? "-"}
                                        </span>
                                        <br />
                                        <span className="text-xs text-muted-foreground">
                                            to AY:{item.to?.academicYearId ?? "-"} / C:{item.to?.classId ?? "-"} / S:{item.to?.sectionId ?? "-"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                        Prev
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {page} / {totalPages}
                    </span>
                    <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
                        Next
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
