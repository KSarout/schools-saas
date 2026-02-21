"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    type SectionDto,
    type CreateSectionPayload,
    CreateSectionPayloadSchema,
    type UpdateSectionPayload,
    UpdateSectionPayloadSchema,
} from "@/features/sections/api/sections.dto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Mode = "create" | "edit";
type Option = { id: string; label: string };

export function SectionFormDialog({
    open,
    onOpenChange,
    mode,
    initial,
    classOptions,
    submitting,
    error,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (next: boolean) => void;
    mode: Mode;
    initial?: SectionDto | null;
    classOptions: Option[];
    submitting?: boolean;
    error?: string | null;
    onSubmit: (payload: CreateSectionPayload | UpdateSectionPayload) => Promise<void>;
}) {
    const t = useTranslations("school.settings.sections");
    const tClasses = useTranslations("school.settings.classes");
    const [name, setName] = useState(initial?.name ?? "");
    const [code, setCode] = useState(initial?.code ?? "");
    const [classId, setClassId] = useState(initial?.classId ?? classOptions[0]?.id ?? "");
    const [capacity, setCapacity] = useState(initial?.capacity ? String(initial.capacity) : "");
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);

    const payload = useMemo(() => {
        const parsedCapacity = capacity.trim() ? Number(capacity) : undefined;

        if (mode === "create") {
            return {
                name: name.trim(),
                code: code.trim(),
                classId,
                capacity: Number.isFinite(parsedCapacity) ? parsedCapacity : undefined,
                isActive,
            } as CreateSectionPayload;
        }

        const next: UpdateSectionPayload = {};
        if (name.trim() && name.trim() !== (initial?.name ?? "")) next.name = name.trim();
        if (code.trim() && code.trim() !== (initial?.code ?? "")) next.code = code.trim();
        if (classId && classId !== (initial?.classId ?? "")) next.classId = classId;

        const initialCapacity = initial?.capacity ?? null;
        const nextCapacity = capacity.trim() ? Number(capacity) : null;
        if (nextCapacity !== initialCapacity) next.capacity = nextCapacity;

        if (isActive !== initial?.isActive) next.isActive = isActive;
        return next;
    }, [mode, name, code, classId, capacity, isActive, initial]);

    const canSubmit = useMemo(() => {
        const parsed = mode === "create" ? CreateSectionPayloadSchema.safeParse(payload) : UpdateSectionPayloadSchema.safeParse(payload);
        return parsed.success && !submitting;
    }, [mode, payload, submitting]);

    async function submit() {
        if (mode === "create") {
            const parsed = CreateSectionPayloadSchema.safeParse(payload);
            if (!parsed.success) return;
            await onSubmit(parsed.data);
            return;
        }
        const parsed = UpdateSectionPayloadSchema.safeParse(payload);
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>{t("name")}</Label>
                            <Input value={name} onChange={(event) => setName(event.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("code")}</Label>
                            <Input value={code} onChange={(event) => setCode(event.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>{tClasses("pageTitle")}</Label>
                        <Select value={classId} onValueChange={setClassId}>
                            <SelectTrigger><SelectValue placeholder={tClasses("pageTitle")} /></SelectTrigger>
                            <SelectContent>
                                {classOptions.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>{t("capacity")}</Label>
                            <Input type="number" min={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("isActive")}</Label>
                            <Select value={isActive ? "ACTIVE" : "INACTIVE"} onValueChange={(value) => setIsActive(value === "ACTIVE")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                                    <SelectItem value="INACTIVE">{t("inactive")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
