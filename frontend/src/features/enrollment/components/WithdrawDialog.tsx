"use client";

import { useState } from "react";
import {
    WithdrawEnrollmentPayloadSchema,
    type EnrollmentListItem,
    type WithdrawEnrollmentPayload,
} from "@/features/enrollment/dto/enrollment.dto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WithdrawDialog({
    open,
    onOpenChange,
    enrollment,
    submitting,
    error,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    enrollment: EnrollmentListItem | null;
    submitting: boolean;
    error?: string | null;
    onSubmit: (payload: WithdrawEnrollmentPayload) => Promise<void>;
}) {
    const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState<string>("");
    const [confirmed, setConfirmed] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const canSubmit = !!enrollment && !!effectiveDate && confirmed && !submitting;

    async function submit() {
        if (!enrollment) return;

        const payload: WithdrawEnrollmentPayload = {
            studentId: enrollment.student.id,
            academicYearId: enrollment.academicYear.id,
            effectiveDate,
            note: note.trim() || undefined,
        };

        const parsed = WithdrawEnrollmentPayloadSchema.safeParse(payload);
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
                    <DialogTitle>Withdraw Enrollment</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Withdraw {enrollment?.student.fullName} ({enrollment?.student.studentCode}) from {enrollment?.academicYear.name}
                    </p>

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

                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(event) => setConfirmed(event.target.checked)}
                        />
                        I confirm this will withdraw the active enrollment.
                    </label>

                    {(validationError || error) ? (
                        <p className="text-sm text-destructive">{validationError ?? error}</p>
                    ) : null}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={submit} disabled={!canSubmit}>Withdraw</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
