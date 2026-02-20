"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Check, Globe, Monitor, Moon, Sun } from "lucide-react"

function useMounted() {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])
    return mounted
}

export function LandingHeaderControls() {
    const mounted = useMounted()

    const { setTheme } = useTheme()
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    const setLang = (nextLocale: string) => {
        router.replace(pathname, { locale: nextLocale })
    }

    if (!mounted) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-md border bg-muted/30" />
                <div className="h-9 w-9 rounded-md border bg-muted/30" />
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            {/* Theme */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Theme">
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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

            {/* Language */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Language">
                        <Globe className="h-4 w-4" />
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
        </div>
    )
}
