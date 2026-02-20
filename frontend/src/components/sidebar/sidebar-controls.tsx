"use client"

import * as React from "react"
import {useTheme} from "next-themes"
import {useLocale} from "next-intl"
import {usePathname, useRouter} from "@/i18n/navigation"

import {Button} from "@/components/ui/button"
import {Separator} from "@/components/ui/separator"
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {Check, Globe, Monitor, Moon, Sun} from "lucide-react"

function useMounted() {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])
    return mounted
}

export function SidebarControls({collapsed}: { collapsed: boolean }) {
    const mounted = useMounted()

    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()
    const { theme, resolvedTheme, setTheme } = useTheme()

    const setLang = (nextLocale: string) => {
        router.replace(pathname, {locale: nextLocale})
    }

    // Avoid hydration mismatch for theme button icons
    if (!mounted) {
        return (
            <div className="space-y-3 px-3 pb-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="h-9 rounded-md border bg-muted/30"/>
                    <div className="h-9 rounded-md border bg-muted/30"/>
                </div>
                <Separator/>
            </div>
        )
    }

    if (collapsed) {
        return (
            <div className="space-y-2 px-3 pb-3">
                <div className="grid gap-2">
                    <TooltipTriggerWrap label="Theme">
                        <ThemeIconMenu theme={theme} resolvedTheme={resolvedTheme} setTheme={setTheme} />
                    </TooltipTriggerWrap>

                    <TooltipTriggerWrap label="Language">
                        <LangIconMenu locale={locale} setLang={setLang} />
                    </TooltipTriggerWrap>
                </div>
                <Separator />
            </div>
        )
    }

    return (
        <div className="space-y-3 px-3 pb-3">
            <div className="text-xs font-medium text-muted-foreground">Preferences</div>
            <div className="grid grid-cols-2 gap-2">
                <ThemeTextMenu theme={theme} resolvedTheme={resolvedTheme} setTheme={setTheme}/>
                <LangTextMenu locale={locale} setLang={setLang}/>
            </div>
            <Separator/>
        </div>
    )
}

function TooltipTriggerWrap({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="w-full">{children}</div>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    )
}

/** Collapsed: icon-only dropdowns */
function ThemeIconMenu({
    theme,
    resolvedTheme,
    setTheme,
}: {
    theme?: string;
    resolvedTheme?: string;
    setTheme: (t: "light" | "dark" | "system") => void;
}) {
    const themeLabel = theme === "system" ? `System (${resolvedTheme ?? "light"})` : theme;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="w-full" aria-label="Theme">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Theme: {themeLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                    <Sun className="h-4 w-4"/> Light
                    {theme === "light" ? <Check className="ml-auto h-4 w-4 text-muted-foreground" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                    <Moon className="h-4 w-4"/> Dark
                    {theme === "dark" ? <Check className="ml-auto h-4 w-4 text-muted-foreground" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                    <Monitor className="h-4 w-4"/> System
                    {theme === "system" ? <Check className="ml-auto h-4 w-4 text-muted-foreground" /> : null}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function LangIconMenu({
                          locale,
                          setLang,
                      }: {
    locale: string
    setLang: (l: string) => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="w-full" aria-label="Language">
                    <Globe className="h-4 w-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Language</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={() => setLang("en")} className="gap-2">
                    <span className="flex-1">English</span>
                    {locale === "en" ? <Check className="h-4 w-4 text-muted-foreground"/> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang("km")} className="gap-2">
                    <span className="flex-1">ខ្មែរ</span>
                    {locale === "km" ? <Check className="h-4 w-4 text-muted-foreground"/> : null}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

/** Expanded: compact text buttons (still dropdown behind the scenes) */
function ThemeTextMenu({
    theme,
    resolvedTheme,
    setTheme,
}: {
    theme?: string;
    resolvedTheme?: string;
    setTheme: (t: "light" | "dark" | "system") => void;
}) {
    const themeLabel = theme === "system" ? `System (${resolvedTheme ?? "light"})` : theme;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-start gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground"/>
                    Theme
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel>Theme: {themeLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                    <Sun className="h-4 w-4"/> Light
                    {theme === "light" ? <Check className="ml-auto h-4 w-4 text-muted-foreground" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                    <Moon className="h-4 w-4"/> Dark
                    {theme === "dark" ? <Check className="ml-auto h-4 w-4 text-muted-foreground" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                    <Monitor className="h-4 w-4"/> System
                    {theme === "system" ? <Check className="ml-auto h-4 w-4 text-muted-foreground" /> : null}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function LangTextMenu({
                          locale,
                          setLang,
                      }: {
    locale: string
    setLang: (l: string) => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-start gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground"/>
                    Language
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel>Language</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={() => setLang("en")} className="gap-2">
                    <span className="flex-1">English</span>
                    {locale === "en" ? <Check className="h-4 w-4 text-muted-foreground"/> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang("km")} className="gap-2">
                    <span className="flex-1">ខ្មែរ</span>
                    {locale === "km" ? <Check className="h-4 w-4 text-muted-foreground"/> : null}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
