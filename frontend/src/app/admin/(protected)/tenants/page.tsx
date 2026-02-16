"use client";

import {useEffect, useMemo, useState} from "react";
import {useDebouncedValue} from "@/lib/useDebouncedValue";

import {useTenants} from "@/features/super-admin/hooks/useTenants";
import {TenantsTable} from "@/features/super-admin/components/TenantsTable";
import {CreateTenantDialog} from "@/features/super-admin/components/CreateTenantDialog";
import {ResetAdminPasswordDialog} from "@/features/super-admin/components/ResetAdminPasswordDialog";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {TenantListItem} from "@/features/super-admin/api/uperAdmin.dto";


export default function TenantsPage() {
    const [q, setQ] = useState("");
    const debouncedQ = useDebouncedValue(q, 300);

    const [page, setPage] = useState(1);
    const limit = 10;

    // Reset paging when search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedQ]);

    const params = useMemo(
        () => ({q: debouncedQ.trim() || undefined, page, limit}),
        [debouncedQ, page]
    );

    const tenantsQuery = useTenants(params);

    const total = tenantsQuery.data?.total ?? 0;
    const totalPages = tenantsQuery.data?.totalPages ?? 1;

    // Keep page in valid range when totalPages changes (safe: effect, not render)
    useEffect(() => {
        if (page > totalPages && totalPages > 0) setPage(totalPages);
    }, [page, totalPages]);

    // Reset dialog state stays in the page (so table stays dumb)
    const [selectedTenant, setSelectedTenant] = useState<TenantListItem | null>(null);
    const [resetOpen, setResetOpen] = useState(false);

    function openReset(t: TenantListItem) {
        setSelectedTenant(t);
        setResetOpen(true);
    }

    function closeReset() {
        setResetOpen(false);
        setSelectedTenant(null);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Schools</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Create and manage school tenants. Reset school admin credentials if needed.
                </CardContent>
            </Card>

            {/* Create */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Create School</CardTitle>
                    <CreateTenantDialog/>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Click “Create School” to create a tenant + admin credentials.
                </CardContent>
            </Card>

            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Schools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <Input
                            placeholder="Search by name or slug..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                Prev
                            </Button>

                            <div className="text-sm text-muted-foreground text-nowrap">
                                Page {page} / {totalPages} • Total {total}
                            </div>

                            <Button
                                variant="outline"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>

                    <TenantsTable
                        tenants={tenantsQuery.data?.items ?? []}
                        isLoading={tenantsQuery.isLoading}
                        error={tenantsQuery.isError ? (tenantsQuery.error as Error) : null}
                        onResetPassword={openReset}
                    />
                </CardContent>
            </Card>

            {/* Stable dialog */}
            <ResetAdminPasswordDialog
                open={resetOpen}
                onOpenChange={(o) => (o ? setResetOpen(true) : closeReset())}
                tenant={selectedTenant}
            />
        </div>
    );
}
