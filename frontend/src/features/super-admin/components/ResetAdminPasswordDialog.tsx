"use client";

import { useEffect, useState } from "react";
import { useResetTenantPassword } from "../hooks/useTenants";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {TenantListItem} from "@/features/super-admin/api/uperAdmin.dto";

export function ResetAdminPasswordDialog({
                                             open,
                                             onOpenChange,
                                             tenant,
                                         }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant: TenantListItem | null;
}) {
    const resetMut = useResetTenantPassword();
    const [result, setResult] = useState<null | { adminEmail: string; tempPassword: string }>(null);

    useEffect(() => {
        if (!open) {
            setResult(null);
            resetMut.reset();
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset School Admin Password</DialogTitle>
                </DialogHeader>

                <div className="text-sm space-y-2">
                    <div>
                        <b>School:</b> {tenant?.name ?? "-"}
                    </div>
                    <div>
                        <b>Slug:</b> {tenant?.slug ?? "-"}
                    </div>

                    {resetMut.isError && (
                        <p className="text-sm text-red-600">
                            {(resetMut.error as Error).message || "Reset failed"}
                        </p>
                    )}

                    {result ? (
                        <div className="rounded-md border p-3 space-y-1">
                            <div>
                                <b>Admin Email:</b> {result.adminEmail}
                            </div>
                            <div>
                                <b>New Temp Password:</b>{" "}
                                <span className="font-mono">{result.tempPassword}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Admin will be forced to change password on next login.
                            </p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            This will generate a new temporary password for the school admin.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>

                    <Button
                        disabled={!tenant || resetMut.isPending}
                        onClick={async () => {
                            if (!tenant) return;
                            const r = await resetMut.mutateAsync(tenant.id);
                            setResult({ adminEmail: r.adminEmail, tempPassword: r.tempPassword });
                        }}
                    >
                        {resetMut.isPending ? "Resetting..." : "Reset"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
