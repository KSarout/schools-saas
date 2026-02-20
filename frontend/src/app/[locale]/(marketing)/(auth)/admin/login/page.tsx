"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"

import { useSuperAdminLogin } from "@/features/super-admin/hooks/useSuperAdminAuth"
import { useSuperAdminStore } from "@/lib/stores/superAdminStore"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {LandingHeaderControls} from "@/components/marketing/landing-header-controls";

export default function AdminLoginPage() {
    const router = useRouter()
    const locale = useLocale()

    const token = useSuperAdminStore((s) => s.token)
    const hydrated = useSuperAdminStore((s) => s.hydrated)

    const login = useSuperAdminLogin()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    useEffect(() => {
        if (hydrated && token) router.replace(`/${locale}/admin/dashboard`)
    }, [hydrated, token, router, locale])

    if (!hydrated) return null
    if (token) return null

    const canSubmit = email.trim() !== "" && password.trim() !== "" && !login.isPending

    return (
        <main className="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-b from-background via-background to-muted/30">
            {/* Background Glow */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute -bottom-50 -left-30 h-130 w-130 rounded-full bg-sky-500/15 blur-[120px]" />
                <div className="absolute -bottom-50 -right-30 h-130 w-130 rounded-full bg-amber-500/15 blur-[120px]" />
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
                            <div className="text-xs text-muted-foreground">Super Admin</div>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        {/*<Button asChild variant="ghost" className="hidden sm:inline-flex">*/}
                        {/*    <Link href={`/${locale}/school/login`}>School Login</Link>*/}
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
                            Super Admin Console
                        </Badge>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                            Manage tenants, plans,
                            <br />
                            and system settings.
                        </h1>

                        <p className="text-base text-muted-foreground sm:text-lg">
                            Restricted access for platform operators. Provision schools, review audit logs, and control permissions.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoTile title="Tenant provisioning" desc="Create schools, admins, and defaults." />
                            <InfoTile title="Security & RBAC" desc="High-privilege access controls." />
                            <InfoTile title="Audit logs" desc="Review activities across tenants." />
                            <InfoTile title="System configs" desc="Integrations, policies, and settings." />
                        </div>

                        <div className="text-sm text-muted-foreground">
                            Need the school portal?{" "}
                            <Link
                                href={`/${locale}/school/login`}
                                className="text-foreground underline underline-offset-4"
                            >
                                Go to School Login
                            </Link>
                            .
                        </div>
                    </div>

                    {/* Login card */}
                    <div className="lg:flex lg:justify-end">
                        <Card className="w-full max-w-md border-border/60 bg-background/60 shadow-xl backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle>Super Admin sign in</CardTitle>
                                <CardDescription>Use your admin credentials to continue.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        placeholder="admin@example.com"
                                        value={email}
                                        autoComplete="email"
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <Link
                                            href={`/${locale}/admin/forgot-password`}
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
                                    />
                                </div>

                                {login.isError && (
                                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                                        <p className="text-sm font-medium text-destructive">Login failed</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(login.error as Error)?.message || "Please check your credentials and try again."}
                                        </p>
                                    </div>
                                )}

                                <Button
                                    className="w-full"
                                    size="lg"
                                    disabled={!canSubmit}
                                    onClick={async () => {
                                        try {
                                            await login.mutateAsync({
                                                email: email.trim().toLowerCase(),
                                                password,
                                            })

                                            router.replace(`/${locale}/admin/dashboard`)
                                        } catch {
                                            // handled by React Query state
                                        }
                                    }}
                                >
                                    {login.isPending ? "Signing in..." : "Continue"}
                                </Button>

                                <div className="relative">
                                    <Separator className="bg-border/60" />
                                    <div className="absolute inset-x-0 -top-3 flex justify-center">
                    <span className="rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground shadow-sm">
                      secure access
                    </span>
                                    </div>
                                </div>

                                <div className="grid gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                                        <span>Environment</span>
                                        <span className="font-medium text-foreground">Production</span>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                                        <span>Session</span>
                                        <span className="font-medium text-foreground">Protected</span>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    This area may be monitored. Unauthorized access is prohibited.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>

            {/* Footer pushed to bottom */}
            <footer className="mt-auto border-t border-border/50 bg-background/60 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} School SaaS
                    </div>

                    <div className="flex gap-4 text-sm">
                        <Link href={`/${locale}`} className="text-muted-foreground hover:text-foreground">
                            Home
                        </Link>
                        <Link href={`/${locale}/login`} className="text-muted-foreground hover:text-foreground">
                            School Login
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
