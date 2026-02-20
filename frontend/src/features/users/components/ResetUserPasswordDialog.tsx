"use client";

import { useState } from "react";
import type { UserDto } from "@/features/users/dto/users.dto";
import { useResetUserPassword } from "@/features/users/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ResetUserPasswordDialog({
    open,
    onOpenChange,
    user,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserDto | null;
}) {
    const mut = useResetUserPassword();
    const [result, setResult] = useState<null | { email: string; tempPassword: string }>(null);

    function close(nextOpen: boolean) {
        if (!nextOpen) {
            setResult(null);
            mut.reset();
        }
        onOpenChange(nextOpen);
    }

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset User Password</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                    <div><b>User:</b> {user?.name ?? "-"}</div>
                    <div><b>Email:</b> {user?.email ?? "-"}</div>

                    {mut.isError ? <p className="text-red-600">{(mut.error as Error).message}</p> : null}

                    {result ? (
                        <div className="rounded border p-3 space-y-1">
                            <div><b>Admin Email:</b> {result.email}</div>
                            <div><b>Temp Password:</b> <span className="font-mono">{result.tempPassword}</span></div>
                            <p className="text-muted-foreground">User must change password on next login.</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">This will rotate credentials and force password change on next login.</p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => close(false)}>Close</Button>
                    <Button
                        disabled={!user || mut.isPending}
                        onClick={async () => {
                            if (!user) return;
                            const next = await mut.mutateAsync(user.id);
                            setResult({ email: next.email, tempPassword: next.tempPassword });
                        }}
                    >
                        {mut.isPending ? "Resetting..." : "Reset Password"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
