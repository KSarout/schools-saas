// import { TopNav } from "@/components/top-nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-muted/40">
            {/*<TopNav />*/}
            {children}
        </div>
    )
}
