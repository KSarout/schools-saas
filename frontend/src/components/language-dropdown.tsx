"use client"

import * as React from "react"
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
import { ClientOnly } from "@/components/client-only"

export function LanguageDropdown() {
    const languages = [
        { code: "en", label: "English" },
        { code: "km", label: "ខ្មែរ" },
    ]

    const [current, setCurrent] = React.useState("en")

    React.useEffect(() => {
        const saved = window.localStorage.getItem("lang")
        if (saved) setCurrent(saved)
    }, [])

    const setLang = (code: string) => {
        setCurrent(code)
        window.localStorage.setItem("lang", code)
        window.location.reload()
    }

    return (
        <ClientOnly>
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
                    {languages.map((l) => (
                        <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className="gap-2">
                            <span className="flex-1">{l.label}</span>
                            {current === l.code ? <Check className="h-4 w-4 text-muted-foreground" /> : null}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </ClientOnly>
    )
}
