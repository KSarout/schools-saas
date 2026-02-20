// "use client";
//
// import { useParams } from "next/navigation";
// import Link from "next/link";
//
// import { useSchoolMe } from "@/features/school-auth/hooks/useSchoolAuth";
// import { useSchoolAuthStore } from "@/lib/stores/useSchoolAuthStore";
//
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
//
// export default function SchoolDashboardPage() {
//     const params = useParams<{ locale: string }>();
//     const locale = params.locale;
//
//     const logout = useSchoolAuthStore((s) => s.logout);
//     const me = useSchoolMe();
//
//     return (
//         <div className="p-6 max-w-4xl mx-auto space-y-6">
//             <Card>
//                 <CardHeader>
//                     <CardTitle>School Dashboard</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                     <div className="text-sm">
//                         <b>Tenant:</b> {me.data?.tenant?.name} ({me.data?.tenant?.slug})
//                     </div>
//                     <div className="text-sm">
//                         <b>User:</b> {me.data?.user?.name} — {me.data?.user?.email}
//                     </div>
//                     <div className="text-sm">
//                         <b>Role:</b> {me.data?.user?.role}
//                     </div>
//
//                     <div className="flex flex-wrap gap-2">
//                         <Button asChild>
//                             <Link href={`/${locale}/school//students`}>Students</Link>
//                         </Button>
//
//                         <Button
//                             variant="outline"
//                             onClick={() => {
//                                 logout();
//                                 window.location.href = `/${locale}/school/login`;
//                             }}
//                         >
//                             Logout
//                         </Button>
//                     </div>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }



"use client"

import Link from "next/link"
import { useLocale } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Users, BookOpen, ClipboardCheck, Receipt, ArrowRight } from "lucide-react"

export default function SchoolDashboardPage() {
    const locale = useLocale()

    return (
        <div className="mx-auto space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">School Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Overview of students, attendance, academics, and billing.
                    </p>
                </div>

                <Button asChild>
                    <Link href={`/${locale}/school/dashboard/students`}>
                        Manage Students <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Stat title="Students" value="—" icon={<Users className="h-4 w-4" />} />
                <Stat title="Classes" value="—" icon={<BookOpen className="h-4 w-4" />} />
                <Stat title="Attendance" value="—" icon={<ClipboardCheck className="h-4 w-4" />} />
                <Stat title="Billing" value="—" icon={<Receipt className="h-4 w-4" />} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur supports-backdrop-filter:bg-card/70">
                    <CardHeader>
                        <CardTitle>Today</CardTitle>
                        <CardDescription>Quick actions for daily operations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ActionRow title="Take attendance" desc="Mark attendance for classes." />
                        <ActionRow title="Add student" desc="Enroll new students into the system." />
                        <ActionRow title="Record payment" desc="Create invoice and receipt." />
                        <Separator />
                        <Button asChild variant="secondary" className="w-full">
                            <Link href={`/${locale}/school/dashboard/students`}>Go to Students</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur supports-backdrop-filter:bg-card/70">
                    <CardHeader>
                        <CardTitle>Alerts</CardTitle>
                        <CardDescription>Things that need attention.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Notice title="Missing attendance" desc="Some classes not marked today." />
                        <Notice title="Unpaid invoices" desc="Check overdue payments." />
                        <Notice title="New admissions" desc="Review pending applications." />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function Stat({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
    return (
        <Card className="bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur supports-backdrop-filter:bg-card/70">
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                    <div className="text-muted-foreground">{icon}</div>
                </div>
                <div className="text-2xl font-bold">{value}</div>
            </CardHeader>
        </Card>
    )
}

function ActionRow({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-xl bg-muted/20 p-3">
            <div className="text-sm font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
    )
}

function Notice({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-xl border border-border/40 bg-background/40 p-3">
            <div className="text-sm font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
    )
}
