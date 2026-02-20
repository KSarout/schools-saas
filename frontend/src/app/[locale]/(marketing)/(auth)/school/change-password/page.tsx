"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useSchoolAuthStore } from "@/lib/stores/useSchoolAuthStore";
import { useChangePassword, useSchoolMe } from "@/features/school-auth/hooks/useSchoolAuth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ChangePasswordPage() {
    const router = useRouter();
    const params = useParams<{ locale: string }>();
    const locale = params.locale;

    const hydrated = useSchoolAuthStore((s) => s.hydrated);
    const token = useSchoolAuthStore((s) => s.token);
    const logout = useSchoolAuthStore((s) => s.logout);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const loginUrl = useMemo(() => `/${locale}/school/login`, [locale]);
    const dashboardUrl = useMemo(() => `/${locale}/school/dashboard`, [locale]);

    // If not authed, go login
    useEffect(() => {
        if (hydrated && !token) router.replace(loginUrl);
    }, [hydrated, token, router, loginUrl]);

    const me = useSchoolMe();
    const changeMut = useChangePassword();

    // If /me fails, logout + go login
    useEffect(() => {
        if (me.isError) {
            logout();
            router.replace(loginUrl);
        }
    }, [me.isError, logout, router, loginUrl]);

    const mustChangePassword = me.data?.user?.mustChangePassword;

    // If user no longer must change password, send to dashboard
    useEffect(() => {
        if (hydrated && token && mustChangePassword === false) {
            router.replace(dashboardUrl);
        }
    }, [hydrated, token, mustChangePassword, router, dashboardUrl]);

    const canSubmit = useMemo(() => {
        return currentPassword.length >= 6 && newPassword.length >= 8 && !changeMut.isPending;
    }, [currentPassword, newPassword, changeMut.isPending]);

    async function onSubmit() {
        if (!canSubmit) return;
        await changeMut.mutateAsync({ currentPassword, newPassword });
        router.replace(dashboardUrl);
    }

    // render gates
    if (!hydrated) return null;
    if (!token) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Set a new password to continue.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New password (min 8)</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>

                    {changeMut.isError && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                            <p className="text-sm font-medium text-destructive">Update failed</p>
                            <p className="text-sm text-muted-foreground">
                                {(changeMut.error as Error)?.message || "Failed to change password"}
                            </p>
                        </div>
                    )}

                    <Button className="w-full" size="lg" onClick={onSubmit} disabled={!canSubmit}>
                        {changeMut.isPending ? "Saving..." : "Update password"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
