"use client"

import * as React from "react"
import {ChevronsUpDown, School} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {TenantCommand} from "@/components/dashboard/tenant-command";

// Replace this with API data later
type Tenant = {
    id: string
    name: string
    code?: string
}

export function TenantSwitcher({
                                   collapsed = false,
                                   tenants,
                                   value,
                                   onChange,
                               }: {
    collapsed?: boolean
    tenants: Tenant[]
    value: string // selected tenant id
    onChange: (tenantId: string) => void
}) {
    const [open, setOpen] = React.useState(false)

    const selected = React.useMemo(
        () => tenants.find((t) => t.id === value),
        [tenants, value]
    )

    if (collapsed) {
        // Minimal icon-only trigger for collapsed sidebar
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="w-full">
                        <School className="h-4 w-4"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                    <TenantCommand
                        tenants={tenants}
                        value={value}
                        onSelect={(id) => {
                            onChange(id)
                            setOpen(false)
                        }}
                    />
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <School className="h-4 w-4"/>
                        </div>
                        <div className="min-w-0 text-left">
                            <div className="truncate text-sm font-medium">
                                {selected?.name ?? "Select school"}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                                {selected?.code ? `Tenant: ${selected.code}` : "Choose a tenant workspace"}
                            </div>
                        </div>
                    </div>

                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[320px] p-0" align="start">
                <TenantCommand
                    tenants={tenants}
                    value={value}
                    onSelect={(id) => {
                        onChange(id)
                        setOpen(false)
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}

