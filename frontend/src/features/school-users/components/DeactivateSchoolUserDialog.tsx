"use client";

import { useTranslations } from "next-intl";
import type { SchoolUserDto } from "@/features/school-users/api/schoolUsers.dto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DeactivateSchoolUserDialog({
    open,
    onOpenChange,
    user,
    pending,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: SchoolUserDto | null;
    pending?: boolean;
    onConfirm: (user: SchoolUserDto) => Promise<void>;
}) {
    const t = useTranslations("school.users");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("deactivateUser")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                    <p>{t("confirmDeactivate")}</p>
                    <div>
                        <b>{t("name")}:</b> {user?.name ?? "-"}
                    </div>
                    <div>
                        <b>{t("email")}:</b> {user?.email ?? "-"}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                        {t("cancel")}
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={!user || pending}
                        onClick={async () => {
                            if (!user) return;
                            await onConfirm(user);
                        }}
                    >
                        {pending ? t("loading") : t("deactivateUser")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
