"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
    return (
        <Button variant="secondary" className="justify-start" onClick={() => history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
        </Button>
    )
}
