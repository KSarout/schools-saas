"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy } from "lucide-react";
import type { SchoolUserDto } from "@/features/school-users/api/schoolUsers.dto";
import { useResetSchoolUserPassword } from "@/features/school-users/hooks/useSchoolUsers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ResetSchoolUserPasswordDialog({
    open,
    onOpenChange,
    user,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: SchoolUserDto | null;
}) {
    const t = useTranslations("school.users");
    const resetMutation = useResetSchoolUserPassword();
    const [result, setResult] = useState<null | { tempPassword: string }>(null);
    const [copied, setCopied] = useState(false);

    function close(nextOpen: boolean) {
        if (!nextOpen) {
            setResult(null);
            setCopied(false);
            resetMutation.reset();
        }
        onOpenChange(nextOpen);
    }

    async function copyPassword() {
        if (!result?.tempPassword) return;
        await navigator.clipboard.writeText(result.tempPassword);
        setCopied(true);
    }

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("resetPassword")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                    <div>
                        <b>{t("name")}:</b> {user?.name ?? "-"}
                    </div>
                    <div>
                        <b>{t("email")}:</b> {user?.email ?? "-"}
                    </div>

                    {resetMutation.isError ? <p className="text-red-600">{(resetMutation.error as Error).message}</p> : null}

                    {result ? (
                        <div className="space-y-2 rounded border p-3">
                            <div>
                                <b>{t("passwordGenerated")}:</b>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="rounded bg-muted px-2 py-1 text-xs sm:text-sm">{result.tempPassword}</code>
                                <Button size="sm" variant="outline" onClick={copyPassword}>
                                    <Copy className="mr-1 h-3.5 w-3.5" />
                                    {copied ? t("copied") : t("copy")}
                                </Button>
                            </div>
                            <p className="text-muted-foreground">{t("tempPasswordHint")}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">{t("confirmReset")}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => close(false)}>
                        {t("cancel")}
                    </Button>
                    <Button
                        disabled={!user || resetMutation.isPending}
                        onClick={async () => {
                            if (!user) return;
                            const next = await resetMutation.mutateAsync(user.id);
                            setResult({ tempPassword: next.tempPassword });
                        }}
                    >
                        {resetMutation.isPending ? t("loading") : t("resetPassword")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
