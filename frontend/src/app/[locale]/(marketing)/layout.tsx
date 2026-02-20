export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-linear-to-b from-background to-muted/40">
        {children}
    </div>
}
