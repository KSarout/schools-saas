"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

export type Tenant = {
    id: string
    name: string
    code?: string
}

export function TenantCommand({
                                  tenants,
                                  value,
                                  onSelect,
                              }: {
    tenants: Tenant[]
    value: string
    onSelect: (tenantId: string) => void
}) {
    return (
        <Command>
            <CommandInput placeholder="Search school..." />
            <CommandList>
                <CommandEmpty>No school found.</CommandEmpty>

                <CommandGroup heading="Schools">
                    {tenants.map((t) => (
                        <CommandItem
                            key={t.id}
                            value={`${t.name} ${t.code ?? ""}`.trim()}
                            onSelect={() => onSelect(t.id)}
                            className="flex items-center justify-between"
                        >
                            <div className="min-w-0">
                                <div className="truncate text-sm">{t.name}</div>
                                {t.code ? (
                                    <div className="truncate text-xs text-muted-foreground">
                                        {t.code}
                                    </div>
                                ) : null}
                            </div>

                            <Check
                                className={cn("h-4 w-4", value === t.id ? "opacity-100" : "opacity-0")}
                            />
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    )
}
