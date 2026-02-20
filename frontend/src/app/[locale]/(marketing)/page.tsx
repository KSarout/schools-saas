import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {LandingHeaderControls} from "@/components/marketing/landing-header-controls";

export default async function HomePage({
                                           params,
                                       }: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params

    return (
        <main className="min-h-screen bg-linear-to-b from-background to-muted/40">
            <div className="fixed right-4 top-4 z-50">
                <LandingHeaderControls />
            </div>
            {/* Hero */}
            <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
                <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                    <div className="space-y-6">
                        <Badge variant="secondary" className="w-fit">
                            Built for modern schools
                        </Badge>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                            Run your school with clarity — admissions, academics, billing, and more.
                        </h1>

                        <p className="text-base text-muted-foreground sm:text-lg">
                            A single platform for admins, teachers, and parents. Manage students, classes, attendance, fees, reports,
                            and permissions across multiple schools with confidence.
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg">
                                <Link href={`/${locale}/school/login`}>Go to School Login</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href={`/${locale}/admin/login`}>Go to Super Admin</Link>
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                Role-based access
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                Multi-tenant ready
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                Audit-friendly logs
                            </div>
                        </div>
                    </div>

                    {/* Right panel */}
                    <Card className="relative overflow-hidden">
                        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-2xl" />
                        <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-sky-500/10 blur-2xl" />

                        <CardHeader>
                            <CardTitle>Quick access</CardTitle>
                            <CardDescription>Choose where you want to sign in.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            <Link
                                href={`/${locale}/school/login`}
                                className="group rounded-xl border bg-background p-4 transition hover:bg-muted/50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="font-medium">School Portal</div>
                                        <div className="text-sm text-muted-foreground">
                                            For school admins, staff, teachers, and finance teams.
                                        </div>
                                    </div>
                                    <span className="text-sm text-muted-foreground transition group-hover:translate-x-0.5">→</span>
                                </div>
                            </Link>

                            <Link
                                href={`/${locale}/admin/login`}
                                className="group rounded-xl border bg-background p-4 transition hover:bg-muted/50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="font-medium">Super Admin</div>
                                        <div className="text-sm text-muted-foreground">
                                            Manage tenants, plans, permissions, and system settings.
                                        </div>
                                    </div>
                                    <span className="text-sm text-muted-foreground transition group-hover:translate-x-0.5">→</span>
                                </div>
                            </Link>

                            <Separator className="my-2" />

                            <div className="grid grid-cols-3 gap-3">
                                <Stat label="Uptime" value="99.9%" />
                                <Stat label="Roles" value="RBAC" />
                                <Stat label="Tenants" value="Multi" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Features */}
            <section className="mx-auto max-w-6xl px-4 pb-14">
                <div className="grid gap-4 md:grid-cols-3">
                    <Feature title="Student lifecycle" desc="Admissions → enrollment → promotion with clean records and history." />
                    <Feature title="Attendance & grading" desc="Daily attendance, assessments, and progress reports teachers love." />
                    <Feature title="Billing & receipts" desc="Fees, invoices, discounts, and payment tracking with exports." />
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-background">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} School SaaS. All rights reserved.</div>
                    <div className="flex gap-4 text-sm">
                        <Link href={`/${locale}/school/login`} className="text-muted-foreground hover:text-foreground">
                            School Login
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

function Feature({ title, desc }: { title: string; desc: string }) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
            </CardHeader>
        </Card>
    )
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-sm font-semibold">{value}</div>
        </div>
    )
}
