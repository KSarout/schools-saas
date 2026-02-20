"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { SchoolGuard } from "@/features/school-auth/components/SchoolGuard"
import { useSchoolMe } from "@/features/school-auth/hooks/useSchoolAuth"
import type { Role } from "@/lib/rbac"

import { SchoolSidebar } from "@/components/school/school-sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useRouter } from "@/i18n/navigation"
import { useSchoolLogout } from "@/features/school-auth/hooks/useSchoolAuth"

export default function SchoolDashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()

    const [open, setOpen] = React.useState(false)

    const logoutMut = useSchoolLogout()
    const me = useSchoolMe()
    const role: Role = (me.data?.user?.role as Role) ?? "SCHOOL_ADMIN"

    const handleLogout = () => {
        logoutMut.mutate()
        router.replace("/school/login")
    }

    return (
        <SchoolGuard>
            <div className="flex h-screen overflow-hidden bg-muted/30">
                {/* Desktop */}
                <div className="hidden md:flex">
                    <SchoolSidebar role={role} onLogoutAction={handleLogout} />
                </div>

                {/* Main */}
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    {/* Mobile top bar */}
                    <div className="flex items-center justify-between border-b bg-background/70 px-4 py-3 backdrop-blur-xl md:hidden">
                        <Button size="icon" variant="outline" onClick={() => setOpen(true)} aria-label="Open menu">
                            <Menu className="h-4 w-4" />
                        </Button>

                        <div className="text-sm font-semibold">School</div>

                        <Button className="hidden" variant="outline" size="sm" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>

                    <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
                </div>

                {/* Mobile drawer */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent side="left" className="w-70 p-0">
                        <VisuallyHidden>
                            <SheetTitle>Navigation</SheetTitle>
                        </VisuallyHidden>

                        <div className="h-full">
                            <SchoolSidebar
                                variant="drawer"
                                role={role}
                                onLogoutAction={handleLogout}
                                onNavigateAction={() => setOpen(false)}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </SchoolGuard>
    )
}
