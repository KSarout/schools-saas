"use client"

import * as React from "react"
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
import { Check, Monitor, Moon, Sun } from "lucide-react"
import { ClientOnly } from "@/components/client-only"

export function ThemeDropdown() {
    const { theme, setTheme, resolvedTheme } = useTheme()

    return (
        <ClientOnly>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Theme" type="button">
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="flex items-center justify-between">
                        Theme
                        <span className="text-xs text-muted-foreground">
              {theme === "system" ? `System (${resolvedTheme})` : theme}
            </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                        <Sun className="h-4 w-4" />
                        <span className="flex-1">Light</span>
                        {theme === "light" ? <Check className="h-4 w-4 text-muted-foreground" /> : null}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                        <Moon className="h-4 w-4" />
                        <span className="flex-1">Dark</span>
                        {theme === "dark" ? <Check className="h-4 w-4 text-muted-foreground" /> : null}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                        <Monitor className="h-4 w-4" />
                        <span className="flex-1">System</span>
                        {theme === "system" ? <Check className="h-4 w-4 text-muted-foreground" /> : null}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </ClientOnly>
    )
}
