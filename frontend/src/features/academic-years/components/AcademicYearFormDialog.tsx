"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    type AcademicYearDto,
    CreateAcademicYearPayloadSchema,
    type CreateAcademicYearPayload,
    UpdateAcademicYearPayloadSchema,
    type UpdateAcademicYearPayload,
} from "@/features/academic-years/api/academicYears.dto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Mode = "create" | "edit";

export function AcademicYearFormDialog({
    open,
    onOpenChange,
    mode,
    initial,
    submitting,
    error,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (next: boolean) => void;
    mode: Mode;
    initial?: AcademicYearDto | null;
    submitting?: boolean;
    error?: string | null;
    onSubmit: (payload: CreateAcademicYearPayload | UpdateAcademicYearPayload) => Promise<void>;
}) {
    const t = useTranslations("school.settings.academicYears");
    const [name, setName] = useState(initial?.name ?? "");
    const [code, setCode] = useState(initial?.code ?? "");
    const [startDate, setStartDate] = useState(initial?.startDate ? initial.startDate.slice(0, 10) : "");
    const [endDate, setEndDate] = useState(initial?.endDate ? initial.endDate.slice(0, 10) : "");
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);

    const payload = useMemo(() => {
        if (mode === "create") {
            return {
                name: name.trim(),
                code: code.trim(),
                startDate,
                endDate,
                isActive,
            } as CreateAcademicYearPayload;
        }

        const next: UpdateAcademicYearPayload = {};
        if (name.trim() && name.trim() !== (initial?.name ?? "")) next.name = name.trim();
        if (code.trim() && code.trim() !== (initial?.code ?? "")) next.code = code.trim();
        if (startDate && startDate !== (initial?.startDate?.slice(0, 10) ?? "")) next.startDate = startDate;
        if (endDate && endDate !== (initial?.endDate?.slice(0, 10) ?? "")) next.endDate = endDate;
        if (isActive !== initial?.isActive) next.isActive = isActive;
        return next;
    }, [mode, name, code, startDate, endDate, isActive, initial]);

    const canSubmit = useMemo(() => {
        const parsed = mode === "create"
            ? CreateAcademicYearPayloadSchema.safeParse(payload)
            : UpdateAcademicYearPayloadSchema.safeParse(payload);
        return parsed.success && !submitting;
    }, [mode, payload, submitting]);

    async function submit() {
        if (mode === "create") {
            const parsed = CreateAcademicYearPayloadSchema.safeParse(payload);
            if (!parsed.success) return;
            await onSubmit(parsed.data);
            return;
        }

        const parsed = UpdateAcademicYearPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        await onSubmit(parsed.data);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? t("create") : t("edit")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>{t("name")}</Label>
                        <Input value={name} onChange={(event) => setName(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>{t("code")}</Label>
                        <Input value={code} onChange={(event) => setCode(event.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>{t("startDate")}</Label>
                            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("endDate")}</Label>
                            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>{t("isActive")}</Label>
                        <Select value={isActive ? "ACTIVE" : "INACTIVE"} onValueChange={(value) => setIsActive(value === "ACTIVE")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                                <SelectItem value="INACTIVE">{t("inactive")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
                    <Button disabled={!canSubmit} onClick={submit}>{mode === "create" ? t("save") : t("update")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
