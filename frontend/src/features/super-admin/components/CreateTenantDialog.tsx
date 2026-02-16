"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateTenant } from "../hooks/useTenants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {CreateTenantPayload} from "@/features/super-admin/api/uperAdmin.dto";

export function CreateTenantDialog() {
    const [open, setOpen] = useState(false);
    const createTenant = useCreateTenant();

    const form = useForm<CreateTenantPayload>({
        resolver: zodResolver(CreateTenantPayload),
        defaultValues: {
            tenantName: "",
            tenantSlug: "",
            adminName: "",
            adminEmail: "",
        },
    });

    const created = createTenant.data ?? null;

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (!o) {
                    form.reset();
                    createTenant.reset();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>Create School</Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create School</DialogTitle>
                </DialogHeader>

                <form
                    className="space-y-3"
                    onSubmit={form.handleSubmit((values) => {
                        // normalize
                        createTenant.mutate({
                            ...values,
                            tenantSlug: values.tenantSlug.trim().toLowerCase(),
                            adminEmail: values.adminEmail.trim().toLowerCase(),
                        });
                    })}
                >
                    <div className="space-y-2">
                        <label className="text-sm">School name</label>
                        <Input {...form.register("tenantName")} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm">School slug</label>
                        <Input placeholder="e.g. westview" {...form.register("tenantSlug")} />
                        <p className="text-xs text-muted-foreground">
                            Used for tenant routing (currently via X-Tenant).
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm">Admin name</label>
                        <Input {...form.register("adminName")} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm">Admin email</label>
                        <Input {...form.register("adminEmail")} />
                    </div>

                    {createTenant.isError && (
                        <p className="text-sm text-red-600">
                            {(createTenant.error as Error).message || "Create tenant failed"}
                        </p>
                    )}

                    {created && (
                        <div className="rounded-md border p-4 text-sm space-y-2">
                            <div>
                                <b>Tenant slug:</b> {created.tenant.slug}
                            </div>
                            <div>
                                <b>Admin email:</b> {created.schoolAdmin.email}
                            </div>
                            <div>
                                <b>Temp password:</b>{" "}
                                <span className="font-mono">{created.schoolAdmin.tempPassword}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Show once. Admin will be forced to change password on next login.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                            Close
                        </Button>
                        <Button type="submit" disabled={createTenant.isPending}>
                            {createTenant.isPending ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
