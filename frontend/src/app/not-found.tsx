import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Home } from "lucide-react"
import { BackButton } from "@/components/back-button"

export default function NotFound({
                                     params,
                                 }: {
    params?: { locale?: string }
}) {
    const locale = params?.locale ?? "en" // fallback locale

    return (
        <div className="min-h-screen bg-linear-to-b from-background to-muted/40 px-6">
            <div className="mx-auto flex min-h-screen max-w-2xl items-center py-12">
                <Card className="w-full overflow-hidden bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur supports-backdrop-filter:bg-card/70">
                    <CardHeader className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Not found
                            </Badge>

                            <div className="text-xs text-muted-foreground">/{locale}</div>
                        </div>

                        <CardTitle className="text-2xl sm:text-3xl">
                            404 — This page doesn’t exist
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            The link may be broken, or the page may have been moved.
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <Separator />

                        <div className="grid gap-3 sm:grid-cols-3">
                            <Button asChild variant="outline" className="justify-start">
                                <Link href={`/${locale}`}>
                                    <Home className="mr-2 h-4 w-4" />
                                    Home
                                </Link>
                            </Button>

                            <BackButton />

                            <Button asChild className="justify-start">
                                <Link href={`/${locale}/school/login`}>
                                    School Login
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
