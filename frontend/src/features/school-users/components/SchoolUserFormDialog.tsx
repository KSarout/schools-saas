"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    type CreateSchoolUserPayload,
    CreateSchoolUserPayloadSchema,
    type SchoolUserDto,
    type SchoolUserRole,
    type UpdateSchoolUserPayload,
    UpdateSchoolUserPayloadSchema,
} from "@/features/school-users/api/schoolUsers.dto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Mode = "create" | "edit";

export function SchoolUserFormDialog({
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
    initial?: SchoolUserDto | null;
    submitting?: boolean;
    error?: string | null;
    onSubmit: (payload: CreateSchoolUserPayload | UpdateSchoolUserPayload) => Promise<void>;
}) {
    const t = useTranslations("school.users");
    const [name, setName] = useState(initial?.name ?? "");
    const [email, setEmail] = useState(initial?.email ?? "");
    const [role, setRole] = useState<SchoolUserRole>(initial?.role ?? "TEACHER");
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);

    const payload = useMemo(() => {
        if (mode === "create") {
            return {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                role,
            };
        }

        const next: UpdateSchoolUserPayload = {};
        if (name.trim() && name.trim() !== (initial?.name ?? "")) next.name = name.trim();
        if (role !== initial?.role) next.role = role;
        if (isActive !== initial?.isActive) next.isActive = isActive;
        return next;
    }, [email, initial?.isActive, initial?.name, initial?.role, isActive, mode, name, role]);

    const canSubmit = useMemo(() => {
        const schema = mode === "create" ? CreateSchoolUserPayloadSchema : UpdateSchoolUserPayloadSchema;
        return schema.safeParse(payload).success && !submitting;
    }, [mode, payload, submitting]);

    async function submit() {
        if (mode === "create") {
            const parsed = CreateSchoolUserPayloadSchema.safeParse(payload);
            if (!parsed.success) return;
            await onSubmit(parsed.data);
            return;
        }

        const parsed = UpdateSchoolUserPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        await onSubmit(parsed.data);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? t("createUser") : t("editUser")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t("name")}</Label>
                        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
                    </div>

                    <div className="space-y-2">
                        <Label>{t("email")}</Label>
                        <Input
                            type="email"
                            value={email}
                            disabled={mode === "edit"}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="user@school.test"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{t("role")}</Label>
                        <Select value={role} onValueChange={(value) => setRole(value as SchoolUserRole)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SCHOOL_ADMIN">SCHOOL_ADMIN</SelectItem>
                                <SelectItem value="TEACHER">TEACHER</SelectItem>
                                <SelectItem value="ACCOUNTANT">ACCOUNTANT</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {mode === "edit" ? (
                        <div className="space-y-2">
                            <Label>{t("status")}</Label>
                            <Select value={isActive ? "ACTIVE" : "INACTIVE"} onValueChange={(value) => setIsActive(value === "ACTIVE")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                                    <SelectItem value="INACTIVE">{t("inactive")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}

                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        {t("cancel")}
                    </Button>
                    <Button onClick={submit} disabled={!canSubmit}>
                        {submitting ? t("loading") : mode === "create" ? t("createUser") : t("save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
