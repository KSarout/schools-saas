"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, Globe } from "lucide-react"

const LOCALES = [
    { code: "en", label: "English" },
    { code: "km", label: "ខ្មែរ" },
] as const

export function LocaleSwitchDropdown() {
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()

    const switchTo = (nextLocale: string) => {
        const parts = pathname.split("/")
        // pathname looks like: /en/... or /km/...
        if (parts.length > 1) parts[1] = nextLocale
        const nextPath = parts.join("/") || `/${nextLocale}`
        router.replace(nextPath)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">
            {locale === "km" ? "ខ្មែរ" : "English"}
          </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LOCALES.map((l) => (
                    <DropdownMenuItem key={l.code} onClick={() => switchTo(l.code)} className="gap-2">
                        <span className="flex-1">{l.label}</span>
                        {locale === l.code ? <Check className="h-4 w-4 text-muted-foreground" /> : null}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
