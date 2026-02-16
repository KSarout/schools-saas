"use client";

import {useEffect} from "react";
import {usePathname, useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {useSuperAdminStore} from "@/lib/stores/superAdminStore";

export default function AdminProtectedLayout({
                                                 children,
                                             }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const hydrated = useSuperAdminStore((s) => s.hydrated);
    const token = useSuperAdminStore((s) => s.token);
    const logout = useSuperAdminStore((s) => s.logout);

    useEffect(() => {
        if (!hydrated) return;
        if (!token) router.replace("/admin/login");
    }, [hydrated, token, router]);

    const NavLink = ({href, label}: { href: string; label: string }) => {
        const active = pathname === href;
        return (
            <a
                href={href}
                className={[
                    "block rounded-md px-3 py-2 text-sm",
                    active ? "bg-muted font-medium" : "hover:bg-muted",
                ].join(" ")}
            >
                {label}
            </a>
        );
    };

    return (
        <div className="min-h-screen bg-muted/40 overflow-x-hidden">
            <div className="mx-auto max-w-6xl p-3 sm:p-6">
                {/* Mobile-first: stack, then 2-col on md */}
                <div className="grid gap-4 md:gap-6 md:grid-cols-[240px_1fr]">
                    <Card className="p-4 h-fit w-full">
                        <div className="font-bold text-lg mb-4">Super Admin</div>

                        <nav className="space-y-1">
                            <NavLink href="/admin/dashboard" label="Dashboard"/>
                            <NavLink href="/admin/tenants" label="Schools"/>
                        </nav>

                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    logout();
                                    router.replace("/admin/login");
                                }}
                            >
                                Logout
                            </Button>
                        </div>
                    </Card>

                    {/* Ensure main content never forces overflow */}
                    <div className="min-w-0">{children}</div>
                </div>
            </div>
        </div>
    );
}
