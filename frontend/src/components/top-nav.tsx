"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Globe, Monitor, Moon, Sun, Check, Menu } from "lucide-react"
import { usePathname, useRouter } from "@/i18n/navigation"

function useMounted() {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])
    return mounted
}

export function TopNav() {
    const mounted = useMounted()
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()
    const { setTheme } = useTheme()

    const [open, setOpen] = React.useState(false)

    // Change locale but keep same route
    const setLang = (nextLocale: string) => {
        router.replace(pathname, { locale: nextLocale })
    }

    // ✅ skeleton must not depend on locale/theme/pathname
    if (!mounted) {
        return (
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
                    <Brand />
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-md border bg-muted/30" />
                        <div className="h-9 w-9 rounded-md border bg-muted/30" />
                        <div className="hidden h-9 w-28 rounded-md border bg-muted/30 sm:block" />
                        <div className="h-9 w-28 rounded-md border bg-muted/30" />
                    </div>
                </div>
            </header>
        )
    }

    return (
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
                <Brand />

                {/* Desktop actions */}
                <div className="hidden items-center gap-2 sm:flex">
                    <ThemeDropdown setTheme={setTheme} />
                    <LanguageDropdown locale={locale} setLang={setLang} />

                    <Button asChild variant="ghost">
                        <Link href={`/${locale}/school/login`}>School Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/${locale}/admin/login`}>Super Admin</Link>
                    </Button>
                </div>

                {/* Mobile hamburger */}
                <div className="flex items-center gap-2 sm:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" aria-label="Open menu">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>

                        <SheetContent side="right" className="p-2">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                                        S
                                    </div>
                                    <div className="leading-tight">
                                        <div className="text-sm font-semibold">School SaaS</div>
                                        <div className="text-xs text-muted-foreground">Modern school management</div>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>

                            <div className="mt-6 grid gap-3">
                                {/* Quick links */}
                                <Button
                                    asChild
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => setOpen(false)}
                                >
                                    <Link href={`/${locale}/school/login`}>School Login</Link>
                                </Button>

                                <Button asChild className="justify-start" onClick={() => setOpen(false)}>
                                    <Link href={`/${locale}/admin/login`}>Super Admin</Link>
                                </Button>

                                <div className="my-2 h-px bg-border" />

                                {/* Controls */}
                                <div className="grid gap-2">
                                    <div className="text-xs font-medium text-muted-foreground">Appearance</div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 justify-start gap-2"
                                            onClick={() => setTheme("light")}
                                        >
                                            <Sun className="h-4 w-4" /> Light
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 justify-start gap-2"
                                            onClick={() => setTheme("dark")}
                                        >
                                            <Moon className="h-4 w-4" /> Dark
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 justify-start gap-2"
                                            onClick={() => setTheme("system")}
                                        >
                                            <Monitor className="h-4 w-4" /> System
                                        </Button>
                                    </div>

                                    <div className="mt-3 text-xs font-medium text-muted-foreground">Language</div>
                                    <div className="grid gap-2">
                                        <Button
                                            variant="outline"
                                            className="justify-start gap-2"
                                            onClick={() => setLang("en")}
                                        >
                                            <Globe className="h-4 w-4" />
                                            English
                                            {locale === "en" ? <Check className="ml-auto h-4 w-4 text-muted-foreground" /> : null}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="justify-start gap-2"
                                            onClick={() => setLang("km")}
                                        >
                                            <Globe className="h-4 w-4" />
                                            ខ្មែរ
                                            {locale === "km" ? <Check className="ml-auto h-4 w-4 text-muted-foreground" /> : null}
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                                    Tip: Language changes update the URL (/{locale}) so refresh & sharing links keep the right
                                    language.
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}

function ThemeDropdown({ setTheme }: { setTheme: (theme: "light" | "dark" | "system") => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Theme" type="button">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                    <Sun className="h-4 w-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                    <Moon className="h-4 w-4" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                    <Monitor className="h-4 w-4" /> System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function LanguageDropdown({
                              locale,
                              setLang,
                          }: {
    locale: string
    setLang: (nextLocale: string) => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Language" type="button">
                    <Globe className="h-4 w-4" />
                    <span className="sr-only">Language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLang("en")} className="gap-2">
                    <span className="flex-1">English</span>
                    {locale === "en" ? <Check className="h-4 w-4 text-muted-foreground" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang("km")} className="gap-2">
                    <span className="flex-1">ខ្មែរ</span>
                    {locale === "km" ? <Check className="h-4 w-4 text-muted-foreground" /> : null}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function Brand() {
    return (
        <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                S
            </div>
            <div className="leading-tight">
                <div className="text-sm font-semibold">School SaaS</div>
                <div className="text-xs text-muted-foreground">Modern school management</div>
            </div>
        </div>
    )
}
