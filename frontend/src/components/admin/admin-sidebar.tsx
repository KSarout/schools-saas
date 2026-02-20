"use client"

import Link from "next/link"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { TenantSwitcher } from "@/components/dashboard/tenant-switcher"
import { canAccess, Role } from "@/lib/rbac"

import {
    LayoutDashboard,
    School,
    Settings,
    LogOut,
    ShieldCheck,
    Users,
    ClipboardCheck,
    CreditCard,
    BarChart3,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react"
import { usePathname } from "@/i18n/navigation"
import { useLocale } from "next-intl"
import {SidebarControls} from "@/components/sidebar/sidebar-controls";

const COLLAPSE_KEY = "admin_sidebar_collapsed"

export function AdminSidebar({
                                 onLogout,
                                 role,
                                 onNavigate,
                             }: {
    onLogout?: () => void
    role: Role
    onNavigate?: () => void
}) {
    const pathname = usePathname()
    const locale = useLocale()

    const [collapsed, setCollapsed] = React.useState(false)

    React.useEffect(() => {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem(COLLAPSE_KEY) : null
        if (raw === "1") setCollapsed(true)
    }, [])

    const toggle = () => {
        setCollapsed((prev) => {
            const next = !prev
            if (typeof window !== "undefined") window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0")
            return next
        })
    }

    const menu = [
        { label: "Dashboard", href: `/${locale}/admin/dashboard`, icon: LayoutDashboard, roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "FINANCE"] as Role[] },
        { label: "Schools", href: `/${locale}/admin/tenants`, icon: School, roles: ["SUPER_ADMIN"] as Role[] },
        { label: "Users", href: `/${locale}/admin/users`, icon: Users, roles: ["SUPER_ADMIN", "SCHOOL_ADMIN"] as Role[] },
        { label: "Attendance", href: `/${locale}/admin/attendance`, icon: ClipboardCheck, roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"] as Role[] },
        { label: "Billing", href: `/${locale}/admin/billing`, icon: CreditCard, roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "FINANCE"] as Role[] },
        { label: "Reports", href: `/${locale}/admin/reports`, icon: BarChart3, roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "FINANCE"] as Role[] },
        { label: "Settings", href: `/${locale}/admin/settings`, icon: Settings, roles: ["SUPER_ADMIN", "SCHOOL_ADMIN"] as Role[] },
    ]

    const filteredMenu = menu.filter((item) => canAccess(role, item.roles))

    const tenants = [
        { id: "t1", name: "Greenwood High", code: "greenwood-high" },
        { id: "t2", name: "Sunrise Academy", code: "sunrise-academy" },
    ]
    const [tenantId, setTenantId] = React.useState("t1")

    return (
        <TooltipProvider delayDuration={0}>
            <div
                className={cn(
                    // layout owns height; sidebar fills it
                    "flex h-full flex-col border-r bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70",
                    "transition-[width] duration-300 ease-in-out",
                    "shrink-0 overflow-hidden",
                    collapsed ? "w-18" : "w-70"
                )}
            >
                {/* Header */}
                <div className={cn("p-4", collapsed ? "space-y-3" : "space-y-4")}>
                    <div className={cn("flex items-start", collapsed ? "justify-center" : "justify-between")}>
                        <Link href={`/${locale}/admin/dashboard`} className={cn("flex items-center gap-2", collapsed && "justify-center")}>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow">
                                S
                            </div>

                            {!collapsed && (
                                <div className="leading-tight">
                                    <div className="text-sm font-semibold">School SaaS</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3" />
                                        Super Admin
                                    </div>
                                </div>
                            )}
                        </Link>

                        {!collapsed && (
                            <Button size="icon" variant="ghost" onClick={toggle} aria-label="Collapse sidebar">
                                <PanelLeftClose className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Collapse button (when collapsed, keep it reachable) */}
                    {collapsed && (
                        <div className="flex justify-center">
                            <Button size="icon" variant="ghost" onClick={toggle} aria-label="Expand sidebar">
                                <PanelLeftOpen className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Tenant Switcher */}
                    <TenantSwitcher
                        collapsed={collapsed}
                        tenants={tenants}
                        value={tenantId}
                        onChange={(id) => {
                            setTenantId(id)
                            onNavigate?.()
                        }}
                    />

                    {!collapsed ? <Separator /> : null}
                </div>

                {/* Menu */}
                <nav className={cn("flex-1 overflow-y-auto px-3", collapsed ? "py-1" : "space-y-1")}>
                    {filteredMenu.map((item) => {
                        const Icon = item.icon

                        // active match: exact for dashboard, prefix for others
                        const active =
                            item.href === `/${locale}/admin/dashboard`
                                ? pathname === item.href
                                : pathname === item.href || pathname.startsWith(item.href + "/")

                        const base = cn(
                            "flex items-center rounded-lg text-sm transition",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )

                        const content = (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(base, collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2")}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                            </Link>
                        )

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                                    <TooltipContent side="right">{item.label}</TooltipContent>
                                </Tooltip>
                            )
                        }

                        return content
                    })}
                </nav>

                <SidebarControls collapsed={collapsed} />

                {/* Bottom */}
                <div className="border-t p-3 space-y-3">
                    {!collapsed && (
                        <div className="rounded-xl border bg-muted/20 p-3">
                            <div className="text-sm font-medium">Super Admin</div>
                            <div className="text-xs text-muted-foreground truncate">superadmin@system.com</div>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        className={cn("w-full", collapsed ? "px-0 justify-center" : "justify-start")}
                        onClick={onLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">Logout</span>}
                    </Button>
                </div>
            </div>
        </TooltipProvider>
    )
}
