"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {TenantListItem} from "@/features/super-admin/api/uperAdmin.dto";

export function TenantsTable({
                                 tenants,
                                 isLoading,
                                 error,
                                 onResetPassword,
                             }: {
    tenants: TenantListItem[];
    isLoading: boolean;
    error: Error | null;
    onResetPassword: (t: TenantListItem) => void;
}) {
    if (error) {
        return (
            <p className="text-sm text-red-600">
                {error.message || "Failed to load tenants"}
            </p>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>School</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={4}>Loading...</TableCell>
                        </TableRow>
                    ) : tenants.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4}>No schools found.</TableCell>
                        </TableRow>
                    ) : (
                        tenants.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell className="font-medium">{t.name}</TableCell>
                                <TableCell className="font-mono text-sm">{t.slug}</TableCell>
                                <TableCell>
                                    {t.isActive ? (
                                        <Badge>Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Disabled</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onResetPassword(t)}
                                    >
                                        Reset admin password
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
