"use client";

import { useMemo, useState } from "react";
import {
    type CreateUserPayload,
    CreateUserPayloadSchema,
    type UpdateUserPayload,
    UpdateUserPayloadSchema,
    type UserDto,
    type UserRole,
} from "@/features/users/dto/users.dto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Mode = "create" | "edit";

export function UserFormDialog({
    open,
    onOpenChange,
    mode,
    initial,
    submitting,
    error,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    mode: Mode;
    initial?: UserDto | null;
    submitting?: boolean;
    error?: string | null;
    onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void> | void;
}) {
    const [name, setName] = useState(initial?.name ?? "");
    const [email, setEmail] = useState(initial?.email ?? "");
    const [role, setRole] = useState<UserRole>(initial?.role ?? "TEACHER");

    const payload = useMemo(() => {
        if (mode === "create") {
            return {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                role,
            };
        }

        const next: UpdateUserPayload = {};
        if (name.trim() && name.trim() !== (initial?.name ?? "")) next.name = name.trim();
        if (role !== initial?.role) next.role = role;
        return next;
    }, [email, initial?.name, initial?.role, mode, name, role]);

    const canSubmit = useMemo(() => {
        const schema = mode === "create" ? CreateUserPayloadSchema : UpdateUserPayloadSchema;
        return schema.safeParse(payload).success && !submitting;
    }, [mode, payload, submitting]);

    async function submit() {
        if (mode === "create") {
            const parsed = CreateUserPayloadSchema.safeParse(payload);
            if (!parsed.success) return;
            await onSubmit(parsed.data);
            return;
        }

        const parsed = UpdateUserPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        await onSubmit(parsed.data);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Create User" : "Edit User"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                    </div>

                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={email}
                            disabled={mode === "edit"}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@school.test"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
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

                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!canSubmit}>
                        {submitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
