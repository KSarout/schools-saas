"use client";

import { useMemo, useState } from "react";
import {
    TransferEnrollmentPayloadSchema,
    type EnrollmentListItem,
    type TransferEnrollmentPayload,
} from "@/features/enrollment/dto/enrollment.dto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ClassOption = { id: string; name: string; academicYearId: string };
type SectionOption = { id: string; name: string; classId: string };

export function TransferDialog({
    open,
    onOpenChange,
    enrollment,
    classes,
    sections,
    submitting,
    error,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    enrollment: EnrollmentListItem | null;
    classes: ClassOption[];
    sections: SectionOption[];
    submitting: boolean;
    error?: string | null;
    onSubmit: (payload: TransferEnrollmentPayload) => Promise<void>;
}) {
    const [toClassId, setToClassId] = useState<string>(enrollment?.class.id ?? "");
    const [toSectionId, setToSectionId] = useState<string>(enrollment?.section.id ?? "");
    const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState<string>("");
    const [validationError, setValidationError] = useState<string | null>(null);

    const classOptions = useMemo(
        () => classes.filter((item) => item.academicYearId === enrollment?.academicYear.id),
        [classes, enrollment]
    );

    const sectionOptions = useMemo(
        () => sections.filter((item) => item.classId === toClassId),
        [sections, toClassId]
    );

    const canSubmit = !!enrollment && !!toClassId && !!toSectionId && !!effectiveDate && !submitting;

    async function submit() {
        if (!enrollment) return;

        const payload: TransferEnrollmentPayload = {
            studentId: enrollment.student.id,
            academicYearId: enrollment.academicYear.id,
            toClassId,
            toSectionId,
            effectiveDate,
            note: note.trim() || undefined,
        };

        const parsed = TransferEnrollmentPayloadSchema.safeParse(payload);
        if (!parsed.success) {
            setValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
            return;
        }

        setValidationError(null);
        await onSubmit(parsed.data);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transfer Enrollment</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        {enrollment?.student.fullName} ({enrollment?.student.studentCode})
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>To Class</Label>
                            <Select
                                value={toClassId}
                                onValueChange={(value) => {
                                    setToClassId(value);
                                    setToSectionId("");
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
                            <Label>To Section</Label>
                            <Select value={toSectionId} onValueChange={setToSectionId}>
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

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Effective Date</Label>
                            <Input
                                type="date"
                                value={effectiveDate}
                                onChange={(event) => setEffectiveDate(event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Note</Label>
                            <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" />
                        </div>
                    </div>

                    {(validationError || error) ? (
                        <p className="text-sm text-destructive">{validationError ?? error}</p>
                    ) : null}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={submit} disabled={!canSubmit}>Transfer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
