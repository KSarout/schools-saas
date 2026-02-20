"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { usePathname } from "@/i18n/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    TooltipProvider,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { SidebarControls } from "@/components/sidebar/sidebar-controls"
import { canAccess, type Role } from "@/lib/rbac"

import {
    PanelLeftClose,
    PanelLeftOpen,
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    ClipboardCheck,
    Receipt,
    BarChart3,
    LogOut,
    ShieldCheck,
} from "lucide-react"

type MenuItem = {
    label: string
    labelKey?: string
    href: (locale: string) => string
    icon: React.ComponentType<{ className?: string }>
    roles: Role[]
    match?: "exact" | "prefix"
}

const COLLAPSE_KEY = "school_sidebar_collapsed"

function normalizePath(path: string) {
    const clean = path.split("?")[0]?.split("#")[0] ?? path;
    const trimmed = clean.replace(/\/+$/, "");
    return trimmed || "/";
}

function stripLocalePrefix(path: string, locale: string) {
    if (path === `/${locale}`) return "/";
    const prefix = `/${locale}/`;
    if (path.startsWith(prefix)) return `/${path.slice(prefix.length)}`;
    return path;
}

const MENU: MenuItem[] = [
    {
        label: "Dashboard",
        href: (l) => `/${l}/school/dashboard`,
        icon: LayoutDashboard,
        roles: ["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"],
        match: "exact",
    },
    {
        label: "Students",
        href: (l) => `/${l}/school/dashboard/students`,
        icon: Users,
        roles: ["SCHOOL_ADMIN", "TEACHER"],
        match: "prefix",
    },
    {
        label: "Teachers",
        href: (l) => `/${l}/school/dashboard/teachers`,
        icon: GraduationCap,
        roles: ["SCHOOL_ADMIN"],
        match: "prefix",
    },
    {
        label: "Classes",
        href: (l) => `/${l}/school/dashboard/classes`,
        icon: BookOpen,
        roles: ["SCHOOL_ADMIN", "TEACHER"],
        match: "prefix",
    },
    {
        label: "Attendance",
        href: (l) => `/${l}/school/dashboard/attendance`,
        icon: ClipboardCheck,
        roles: ["SCHOOL_ADMIN", "TEACHER"],
        match: "prefix",
    },
    {
        label: "Fees",
        href: (l) => `/${l}/school/dashboard/fees`,
        icon: Receipt,
        roles: ["SCHOOL_ADMIN", "ACCOUNTANT"],
        match: "prefix",
    },
    {
        label: "Reports",
        href: (l) => `/${l}/school/dashboard/reports`,
        icon: BarChart3,
        roles: ["SCHOOL_ADMIN", "ACCOUNTANT"],
        match: "prefix",
    },
    {
        label: "Users",
        labelKey: "school.users.pageTitle",
        href: (l) => `/${l}/school/settings/users`,
        icon: ShieldCheck,
        roles: ["SCHOOL_ADMIN", "ACCOUNTANT", "TEACHER"],
        match: "prefix",
    },
]

export function SchoolSidebar({
                                  role,
                                  onLogoutAction,
                                  onNavigateAction,
                                  variant = "desktop",
                              }: {
    role: Role
    onLogoutAction: () => void
    onNavigateAction?: () => void
    variant?: "desktop" | "drawer"
}) {

    const isDrawer = variant === "drawer"

    const locale = useLocale()
    const t = useTranslations()
    const pathname = usePathname()

    const [collapsed, setCollapsed] = React.useState(false)


    React.useEffect(() => {
        if (isDrawer) return
        const raw = typeof window !== "undefined" ? window.localStorage.getItem(COLLAPSE_KEY) : null
        if (raw === "1") setCollapsed(true)
    }, [isDrawer])


    const toggle = () => {
        if (isDrawer) return // 🚫 disable toggle in drawer
        setCollapsed((prev) => {
            const next = !prev
            if (typeof window !== "undefined") window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0")
            return next
        })
    }
    const effectiveCollapsed = isDrawer ? false : collapsed
    const filtered = React.useMemo(() => MENU.filter((m) => canAccess(role, m.roles)), [role])

    return (
        <TooltipProvider delayDuration={0}>
            <div
                className={cn(
                    "flex h-full flex-col border-r bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70",
                    "transition-[width] duration-300 ease-in-out overflow-hidden",
                    collapsed ? "w-18" : "w-70"
                )}
            >
                {/* Header */}
                <div className={cn("p-4", collapsed ? "space-y-3" : "space-y-4")}>
                    <div className={cn("flex items-start", collapsed ? "justify-center" : "justify-between")}>
                        <Link href={`/${locale}/school/dashboard`} className={cn("flex items-center gap-2", collapsed && "justify-center")}>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow">
                                S
                            </div>

                            {!collapsed && (
                                <div className="leading-tight">
                                    <div className="text-sm font-semibold">School Portal</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3" />
                                        {role.replaceAll("_", " ")}
                                    </div>
                                </div>
                            )}
                        </Link>

                        {/* ✅ collapse button only on desktop */}
                        {!effectiveCollapsed && !isDrawer && (
                            <Button size="icon" variant="ghost" onClick={toggle} aria-label="Collapse sidebar">
                                <PanelLeftClose className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* ✅ expand button only on desktop */}
                    {effectiveCollapsed && !isDrawer && (
                        <div className="flex justify-center">
                            <Button size="icon" variant="ghost" onClick={toggle} aria-label="Expand sidebar">
                                <PanelLeftOpen className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {!effectiveCollapsed ? <Separator /> : null}

                </div>

                {/* Menu */}
                <nav className={cn("flex-1 overflow-y-auto px-3", collapsed ? "py-1 space-y-1" : "space-y-1")}>
                    {filtered.map((item) => {
                        const href = item.href(locale)
                        const label = item.labelKey ? t(item.labelKey) : item.label
                        const currentPath = normalizePath(pathname)
                        const targetPath = normalizePath(stripLocalePrefix(href, locale))

                        const active =
                            item.match === "exact"
                                ? currentPath === targetPath
                                : currentPath === targetPath || currentPath.startsWith(targetPath + "/")

                        const Icon = item.icon

                        const link = (
                            <Link
                                key={href}
                                href={href}
                                onClick={onNavigateAction}
                                className={cn(
                                    "flex items-center rounded-lg text-sm transition",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    active
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2"
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span className="truncate">{label}</span>}
                            </Link>
                        )

                        if (collapsed) {
                            return (
                                <Tooltip key={href}>
                                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                                    <TooltipContent side="right">{label}</TooltipContent>
                                </Tooltip>
                            )
                        }

                        return link
                    })}
                </nav>

                {/* Preferences (Theme + Language) */}
                <SidebarControls collapsed={collapsed} />

                {/* Bottom: Logout */}
                <div className="border-t p-3">
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="w-full" onClick={onLogoutAction} aria-label="Logout">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Logout</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={onLogoutAction}>
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}
