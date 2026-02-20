"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {useSchoolLogin} from "@/features/school-auth/hooks/useSchoolAuth";
import {LandingHeaderControls} from "@/components/marketing/landing-header-controls";

// ✅ Wire these when ready
// import { useSchoolLogin } from "@/features/school-auth/hooks/useSchoolAuth"
// import { useSchoolAuthStore } from "@/lib/stores/useSchoolAuthStore"

type LoginLike = {
    isPending: boolean
    isError: boolean
    error: null | Error
    mutateAsync?: (payload: { email: string; password: string }) => Promise<any>
}

export default function SchoolLoginPage() {
    const router = useRouter()
    const locale = useLocale()

    // ✅ Replace these placeholders with your real store
    // const hydrated = useSchoolAuthStore((s) => s.hydrated)
    // const token = useSchoolAuthStore((s) => s.token)
    // const setTenantSlug = useSchoolAuthStore((s) => s.setTenantSlug)
    // const setToken = useSchoolAuthStore((s) => s.setToken)

    const hydrated = true
    const token = null
    const setTenantSlug = (v: string) => v
    const setToken = (v: string) => v

    // ✅ Replace with your real mutation
    const login = useSchoolLogin()
    // const login: LoginLike = { isPending: false, isError: false, error: null }

    const [tenant, setTenant] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Single source of truth for post-login route
    const dashboardHref = useMemo(() => `/${locale}/school/dashboard`, [locale])
    const changePasswordHref = useMemo(() => `/${locale}/school/change-password`, [locale])

    useEffect(() => {
        if (hydrated && token) router.replace(dashboardHref)
    }, [hydrated, token, router, dashboardHref])

    const normalized = useMemo(() => {
        return {
            tenantSlug: tenant.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
            password: password,
        }
    }, [tenant, email, password])

    const canSubmit = useMemo(() => {
        return (
            normalized.tenantSlug.length > 0 &&
            normalized.email.length > 0 &&
            normalized.password.trim().length > 0 &&
            !login.isPending
        )
    }, [normalized, login.isPending])

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return

        // 1) Persist tenant slug BEFORE calling /auth/login so interceptor can attach X-Tenant
        setTenantSlug(normalized.tenantSlug)

        // 2) Call login API
        // If you have login.mutateAsync, do it here
        if (login.mutateAsync) {
            const data = await login.mutateAsync({
                tenantSlug: normalized.tenantSlug,
                email: normalized.email,
                password: normalized.password,
            })

            // Expected backend response: { accessToken, mustChangePassword, ... }
            if (data?.accessToken) setToken(data.accessToken)

            if (data?.mustChangePassword) router.replace(changePasswordHref)
            else router.replace(dashboardHref)
            return
        }

        // Placeholder fallback: route only
        router.replace(dashboardHref)
    }, [canSubmit, normalized, login, router, dashboardHref, changePasswordHref, setTenantSlug, setToken])

    const onEnterSubmit = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") void handleSubmit()
        },
        [handleSubmit]
    )

    if (!hydrated) return null

    return (
        <main className="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-b from-background via-background to-muted/30">
            {/* Background Glow */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-primary/18 blur-[120px]" />
                <div className="absolute -bottom-50 -left-30 h-130 w-130 rounded-full bg-sky-500/14 blur-[120px]" />
                <div className="absolute -bottom-55 -right-35 h-130 w-130 rounded-full bg-emerald-500/12 blur-[120px]" />
            </div>

            {/* Header */}
            <header className="border-b border-border/50 bg-background/60 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <Link href={`/${locale}`} className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow">
                            S
                        </div>
                        <div className="leading-tight">
                            <div className="text-sm font-semibold">School SaaS</div>
                            <div className="text-xs text-muted-foreground">School Portal</div>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        {/*<Button asChild variant="ghost" className="hidden sm:inline-flex">*/}
                        {/*    <Link href={`/${locale}/admin/login`}>Super Admin</Link>*/}
                        {/*</Button>*/}
                        {/*<Button asChild variant="outline">*/}
                        {/*    <Link href={`/${locale}`}>Home</Link>*/}
                        {/*</Button>*/}
                        <LandingHeaderControls />
                    </div>
                </div>
            </header>

            {/* Content grows */}
            <div className="flex-1">
                <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2 lg:items-center lg:py-16">
                    {/* Left panel */}
                    <div className="space-y-6">
                        <Badge variant="secondary" className="w-fit">
                            School Portal
                        </Badge>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                            Welcome back.
                            <br />
                            Sign in to your school workspace.
                        </h1>

                        <p className="text-base text-muted-foreground sm:text-lg">
                            Manage classes, attendance, grading, student records, and billing — with role-based access for staff and admins.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoTile title="Attendance & grading" desc="Fast daily flow for teachers and admins." />
                            <InfoTile title="Students & classes" desc="Clean records with history and exports." />
                            <InfoTile title="Fees & receipts" desc="Track payments, invoices, and discounts." />
                            <InfoTile title="Role-based access" desc="Secure permissions for every team." />
                        </div>

                        <div className="text-sm text-muted-foreground">
                            Managing tenants?{" "}
                            <Link href={`/${locale}/admin/login`} className="text-foreground underline underline-offset-4">
                                Go to Super Admin
                            </Link>
                            .
                        </div>
                    </div>

                    {/* Login card */}
                    <div className="lg:flex lg:justify-end">
                        <Card className="w-full max-w-md border-border/60 bg-background/60 shadow-xl backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle>Sign in</CardTitle>
                                <CardDescription>Use your school credentials to continue.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="tenant">School / Tenant</Label>
                                    <Input
                                        id="tenant"
                                        placeholder="e.g. greenwood-high"
                                        value={tenant}
                                        autoComplete="organization"
                                        onChange={(e) => setTenant(e.target.value)}
                                        onKeyDown={onEnterSubmit}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Tip: enter your tenant slug provided by your school admin.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        placeholder="name@school.edu"
                                        value={email}
                                        type="email"
                                        autoComplete="email"
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={onEnterSubmit}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <Link
                                            href={`/${locale}/forgot-password`}
                                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        autoComplete="current-password"
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={onEnterSubmit}
                                    />
                                </div>

                                {login.isError && (
                                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                                        <p className="text-sm font-medium text-destructive">Login failed</p>
                                        <p className="text-sm text-muted-foreground">
                                            {login.error?.message || "Please check your details and try again."}
                                        </p>
                                    </div>
                                )}

                                <Button className="w-full" size="lg" disabled={!canSubmit} onClick={() => void handleSubmit()}>
                                    {login.isPending ? "Signing in..." : "Continue"}
                                </Button>

                                <div className="relative">
                                    <Separator className="bg-border/60" />
                                    <div className="absolute inset-x-0 -top-3 flex justify-center">
                    <span className="rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground shadow-sm">
                      secure sign-in
                    </span>
                                    </div>
                                </div>

                                <Button className="w-full" variant="outline" size="lg" type="button">
                                    Continue with SSO
                                </Button>

                                <p className="text-xs text-muted-foreground">
                                    By continuing, you agree to your school’s policies and our terms.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>

            {/* Footer pushed to bottom */}
            <footer className="mt-auto border-t border-border/50 bg-background/60 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} School SaaS</div>

                    <div className="flex gap-4 text-sm">
                        <Link href={`/${locale}`} className="text-muted-foreground hover:text-foreground">
                            Home
                        </Link>
                        <Link href={`/${locale}/admin/login`} className="text-muted-foreground hover:text-foreground">
                            Super Admin
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    )
}

function InfoTile({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-xl border border-border/60 bg-background/40 p-4 backdrop-blur-sm">
            <div className="text-sm font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
    )
}
