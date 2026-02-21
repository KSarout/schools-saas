"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EnrollmentStatus } from "@/features/enrollment/dto/enrollment.dto";

type Option = {
    id: string;
    name: string;
};

export function EnrollmentFiltersBar({
    q,
    onQChange,
    academicYearId,
    onAcademicYearChange,
    classId,
    onClassChange,
    sectionId,
    onSectionChange,
    status,
    onStatusChange,
    academicYearOptions,
    classOptions,
    sectionOptions,
    limit,
    onLimitChange,
    total,
}: {
    q: string;
    onQChange: (value: string) => void;
    academicYearId: string;
    onAcademicYearChange: (value: string) => void;
    classId: string;
    onClassChange: (value: string) => void;
    sectionId: string;
    onSectionChange: (value: string) => void;
    status: EnrollmentStatus | "ALL";
    onStatusChange: (value: EnrollmentStatus | "ALL") => void;
    academicYearOptions: Option[];
    classOptions: Option[];
    sectionOptions: Option[];
    limit: number;
    onLimitChange: (value: number) => void;
    total: number;
}) {
    return (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Input
                placeholder="Search student name/code/email/phone"
                value={q}
                onChange={(event) => onQChange(event.target.value)}
                className="lg:col-span-2"
            />

            <Select value={academicYearId} onValueChange={onAcademicYearChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Academic Year</SelectItem>
                    {academicYearOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                            {option.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={classId} onValueChange={onClassChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Class</SelectItem>
                    {classOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                            {option.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={sectionId} onValueChange={onSectionChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Section</SelectItem>
                    {sectionOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                            {option.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => onStatusChange(value as EnrollmentStatus | "ALL") }>
                <SelectTrigger>
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Status</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="TRANSFERRED">TRANSFERRED</SelectItem>
                    <SelectItem value="PROMOTED">PROMOTED</SelectItem>
                    <SelectItem value="WITHDRAWN">WITHDRAWN</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground md:col-span-3 lg:col-span-6">
                <span>Total: {total}</span>
                <div className="flex items-center gap-2">
                    <span>Rows</span>
                    <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
