"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle } from "lucide-react"

type Props = {
    open: boolean
    onOpenChange: (v: boolean) => void
    studentName: string
    submitting?: boolean
    error?: string | null
    onConfirm: () => Promise<void> | void
}

export function DeleteStudentDialog({
                                        open,
                                        onOpenChange,
                                        studentName,
                                        submitting,
                                        error,
                                        onConfirm,
                                    }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <DialogTitle className="text-lg">Delete student</DialogTitle>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        This action will permanently remove the student record.
                    </p>
                </DialogHeader>

                <Separator />

                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm">
                    <div className="text-muted-foreground">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-foreground">{studentName}</span>?
                    </div>

                    <div className="mt-1 text-destructive">
                        This cannot be undone.
                    </div>
                </div>

                {error ? (
                    <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
                        <div className="font-medium">Delete failed</div>
                        <div className="text-destructive/90">{error}</div>
                    </div>
                ) : null}

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>

                    <Button variant="destructive" onClick={onConfirm} disabled={!!submitting}>
                        {submitting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
