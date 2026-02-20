"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Menu } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

import { useSuperAdminStore } from "@/lib/stores/superAdminStore"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import type { Role } from "@/lib/rbac"
import { useSuperAdminLogout } from "@/features/super-admin/hooks/useSuperAdminAuth"

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const locale = useLocale()

    const hydrated = useSuperAdminStore((s) => s.hydrated)
    const token = useSuperAdminStore((s) => s.token)
    const logoutMut = useSuperAdminLogout()

    const role: Role = "SUPER_ADMIN"

    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        if (!hydrated) return
        if (!token) router.replace(`/${locale}/admin/login`)
    }, [hydrated, token, router, locale])

    const doLogout = () => {
        logoutMut.mutate()
        router.replace(`/${locale}/admin/login`)
    }

    if (!hydrated) return null
    if (!token) return null

    return (
        <div className="flex h-screen overflow-hidden bg-muted/30">
            {/* Desktop Sidebar (width controlled by AdminSidebar) */}
            <aside className="hidden md:flex">
                <AdminSidebar role={role} onLogout={doLogout} />
            </aside>

            {/* Main Column */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Mobile Top Bar */}
                <div className="flex items-center justify-between border-b bg-background/70 px-4 py-3 backdrop-blur-xl md:hidden">
                    <Button size="icon" variant="outline" onClick={() => setOpen(true)} aria-label="Open menu">
                        <Menu className="h-4 w-4" />
                    </Button>

                    <div className="text-sm font-semibold">Super Admin</div>

                    <Button variant="outline" size="sm" onClick={doLogout}>
                        Logout
                    </Button>
                </div>

                {/* Content */}
                <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </main>
            </div>

            {/* Mobile Drawer */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="left" className="w-[320px] p-0">
                    <VisuallyHidden>
                        <SheetTitle>Navigation</SheetTitle>
                    </VisuallyHidden>

                    <div className="h-full">
                        <AdminSidebar role={role} onLogout={doLogout} onNavigate={() => setOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
