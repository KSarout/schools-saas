"use client";

import {useRouter} from "next/navigation";
import {useSuperAdminMe} from "@/features/super-admin/hooks/useSuperAdminMe";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {useSuperAdminStore} from "@/lib/stores/superAdminStore";

export default function AdminDashboardPage() {
    const router = useRouter();

    // If you have persisted store with hydration flag, use it:
    const hydrated = useSuperAdminStore((s) => s.hydrated);
    const token = useSuperAdminStore((s) => s.token);
    const logout = useSuperAdminStore((s) => s.logout);

    const meQuery = useSuperAdminMe();

    // Wait for hydration if you persist the token
    if (!hydrated) return null;

    // Protected layout should already block this, but keep safe:
    if (!token) return null;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Super Admin Dashboard</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    {meQuery.isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <>
                            <div className="text-sm">
                                <b>Email:</b> {meQuery.data?.superAdmin.email}
                            </div>

                            <div className="text-sm">
                                <b>ID:</b> {meQuery.data?.superAdmin.id}
                            </div>
                        </>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={() => router.push("/admin/tenants")}>
                            Manage Tenants
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                logout();
                                router.replace("/admin/login");
                            }}
                        >
                            Logout
                        </Button>
                    </div>

                    {meQuery.isError && (
                        <p className="text-sm text-red-600">
                            {(meQuery.error as Error).message}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
