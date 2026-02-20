"use client"

import * as React from "react"
import Link from "next/link"
import {useLocale} from "next-intl"
import {useSuperAdminMe} from "@/features/super-admin/hooks/useSuperAdminMe"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Separator} from "@/components/ui/separator"
import {Skeleton} from "@/components/ui/skeleton"
import {useSuperAdminStore} from "@/lib/stores/superAdminStore"
import {
    Building2,
    ShieldCheck,
    Users,
    ArrowRight,
    Settings,
    LayoutDashboard,
} from "lucide-react"

export default function AdminDashboardPage() {
    const locale = useLocale()

    const hydrated = useSuperAdminStore((s) => s.hydrated)
    const token = useSuperAdminStore((s) => s.token)

    const meQuery = useSuperAdminMe()

    if (!hydrated) {
        return (
            <div className="mx-auto space-y-6">
                <div className="flex items-end justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-56"/>
                        <Skeleton className="h-4 w-80"/>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-36"/>
                        <Skeleton className="h-9 w-24"/>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-28"/>
                    <Skeleton className="h-28"/>
                    <Skeleton className="h-28"/>
                </div>

                <Skeleton className="h-72"/>
            </div>
        )
    }

    if (!token) return null

    const adminEmail = meQuery.data?.superAdmin.email ?? "—"
    const adminId = meQuery.data?.superAdmin.id ?? "—"

    return (
        <div className="mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <ShieldCheck className="h-4 w-4"/>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Super Admin</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Manage tenants, platform access, and system settings across schools.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button asChild>
                        <Link href={`/${locale}/admin/tenants`}>
                            <Building2 className="mr-2 h-4 w-4"/>
                            Manage Tenants
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                    title="Tenants"
                    value="—"
                    description="Schools onboarded"
                    icon={<Building2 className="h-4 w-4"/>}
                />
                <StatCard
                    title="Roles"
                    value="RBAC"
                    description="Policy-based access control"
                    icon={<Users className="h-4 w-4"/>}
                />
                <StatCard
                    title="Security"
                    value="Enabled"
                    description="Audit-ready actions"
                    icon={<ShieldCheck className="h-4 w-4"/>}
                />
            </div>

            {/* Main */}
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                {/* Account */}
                <Card className="bg-card shadow-sm ring-1 ring-border/30 overflow-hidden">
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground"/>
                            Overview
                        </CardTitle>
                        <CardDescription>Your account and quick actions.</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {meQuery.isError ? (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                                <div className="font-medium text-destructive">Failed to load profile</div>
                                <div className="mt-1 text-muted-foreground">
                                    {(meQuery.error as Error).message}
                                </div>
                            </div>
                        ) : meQuery.isLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-72"/>
                                <Skeleton className="h-4 w-64"/>
                                <Skeleton className="h-4 w-80"/>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoRow label="Email" value={adminEmail}/>
                                <InfoRow label="Admin ID" value={adminId}/>
                                <InfoRow label="Session" value="Active"/>
                                <InfoRow label="Locale" value={locale}/>
                            </div>
                        )}

                        <Separator/>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <QuickLink
                                href={`/${locale}/admin/tenants`}
                                title="Tenants"
                                desc="Create schools, manage plans, and tenant settings."
                                icon={<Building2 className="h-4 w-4"/>}
                            />
                            <QuickLink
                                href="#"
                                title="Platform Settings"
                                desc="System-wide configuration and policies."
                                icon={<Settings className="h-4 w-4"/>}
                                disabled
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Next steps */}
                <Card className="bg-card shadow-sm ring-1 ring-border/30">
                    <CardHeader className="space-y-1">
                        <CardTitle>Next steps</CardTitle>
                        <CardDescription>Common tasks after signing in.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ChecklistItem
                            title="Create a tenant"
                            desc="Add a school, configure plan and admin account."
                        />
                        <ChecklistItem
                            title="Review access & roles"
                            desc="Ensure permissions match org policy."
                        />
                        <ChecklistItem
                            title="Verify integrations"
                            desc="Email/SMS, payments, exports (if enabled)."
                        />

                        <Separator className="my-2"/>

                        <Button asChild variant="secondary" className="w-full">
                            <Link href={`/${locale}/admin/tenants`}>
                                Go to Tenants
                                <ArrowRight className="ml-2 h-4 w-4"/>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatCard({
                      title,
                      value,
                      description,
                      icon,
                  }: {
    title: string
    value: string
    description: string
    icon: React.ReactNode
}) {
    return (
        <Card className="bg-card shadow-sm ring-1 ring-border/30">
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
                    <div className="text-foreground">{icon}</div>
                </div>
                <div className="text-2xl font-bold">{value}</div>
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
        </Card>
    )
}

function InfoRow({label, value}: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm font-semibold break-all">{value}</div>
        </div>
    )
}

function QuickLink({
                       href,
                       title,
                       desc,
                       icon,
                       disabled,
                   }: {
    href: string
    title: string
    desc: string
    icon: React.ReactNode
    disabled?: boolean
}) {
    const content = (
        <div
            className="flex items-start justify-between gap-3 rounded-xl border bg-background p-4 transition hover:bg-muted/40">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">{icon}</div>
                <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground"/>
        </div>
    )

    if (disabled) {
        return (
            <div className="opacity-60">
                <div className="cursor-not-allowed">{content}</div>
            </div>
        )
    }

    return (
        <Link href={href} className="block">
            {content}
        </Link>
    )
}

function ChecklistItem({title, desc}: { title: string; desc: string }) {
    return (
        <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-sm font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
    )
}
