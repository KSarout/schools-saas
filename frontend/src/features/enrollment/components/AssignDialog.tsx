"use client";

import { useMemo, useState } from "react";
import {
    AssignEnrollmentPayloadSchema,
    type AssignEnrollmentPayload,
} from "@/features/enrollment/dto/enrollment.dto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StudentOption = { id: string; name: string; studentCode: string };
type YearOption = { id: string; name: string };
type ClassOption = { id: string; name: string; academicYearId: string };
type SectionOption = { id: string; name: string; classId: string };

export function AssignDialog({
    open,
    onOpenChange,
    students,
    academicYears,
    classes,
    sections,
    submitting,
    error,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    students: StudentOption[];
    academicYears: YearOption[];
    classes: ClassOption[];
    sections: SectionOption[];
    submitting: boolean;
    error?: string | null;
    onSubmit: (payload: AssignEnrollmentPayload) => Promise<void>;
}) {
    const [studentId, setStudentId] = useState<string>(students[0]?.id ?? "");
    const [academicYearId, setAcademicYearId] = useState<string>(academicYears[0]?.id ?? "");
    const [classId, setClassId] = useState<string>("");
    const [sectionId, setSectionId] = useState<string>("");
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState<string>("");
    const [validationError, setValidationError] = useState<string | null>(null);

    const classOptions = useMemo(
        () => classes.filter((item) => !academicYearId || item.academicYearId === academicYearId),
        [classes, academicYearId]
    );

    const sectionOptions = useMemo(
        () => sections.filter((item) => !classId || item.classId === classId),
        [sections, classId]
    );

    const canSubmit = !!studentId && !!academicYearId && !!classId && !!sectionId && !!startDate && !submitting;

    async function submit() {
        const payload: AssignEnrollmentPayload = {
            studentId,
            academicYearId,
            classId,
            sectionId,
            startDate,
            note: note.trim() || undefined,
        };

        const parsed = AssignEnrollmentPayloadSchema.safeParse(payload);
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            setValidationError(firstIssue?.message ?? "Invalid input");
            return;
        }

        setValidationError(null);
        await onSubmit(parsed.data);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Enrollment</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Student</Label>
                        <Select value={studentId} onValueChange={setStudentId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map((student) => (
                                    <SelectItem key={student.id} value={student.id}>
                                        {student.name} ({student.studentCode})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Academic Year</Label>
                            <Select
                                value={academicYearId}
                                onValueChange={(value) => {
                                    setAcademicYearId(value);
                                    setClassId("");
                                    setSectionId("");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select academic year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicYears.map((year) => (
                                        <SelectItem key={year.id} value={year.id}>
                                            {year.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Class</Label>
                            <Select
                                value={classId}
                                onValueChange={(value) => {
                                    setClassId(value);
                                    setSectionId("");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classOptions.map((classOption) => (
                                        <SelectItem key={classOption.id} value={classOption.id}>
                                            {classOption.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Section</Label>
                            <Select value={sectionId} onValueChange={setSectionId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sectionOptions.map((section) => (
                                        <SelectItem key={section.id} value={section.id}>
                                            {section.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Note</Label>
                        <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" />
                    </div>

                    {(validationError || error) ? (
                        <p className="text-sm text-destructive">{validationError ?? error}</p>
                    ) : null}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={submit} disabled={!canSubmit}>Assign</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
