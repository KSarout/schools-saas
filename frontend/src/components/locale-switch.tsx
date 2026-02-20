"use client"

import { usePathname, useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"

export function LocaleSwitch() {
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()

    const switchTo = (nextLocale: string) => {
        const parts = pathname.split("/")
        if (parts.length > 1) parts[1] = nextLocale
        router.replace(parts.join("/"))
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                variant={locale === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => switchTo("en")}
            >
                EN
            </Button>
            <Button
                variant={locale === "km" ? "default" : "outline"}
                size="sm"
                onClick={() => switchTo("km")}
            >
                KM
            </Button>
        </div>
    )
}
