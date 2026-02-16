"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";

import {useSuperAdminLogin} from "@/features/super-admin/hooks/useSuperAdminAuth";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useSuperAdminStore} from "@/lib/stores/superAdminStore";

export default function AdminLoginPage() {
    const router = useRouter();

    const token = useSuperAdminStore((s) => s.token);
    const hydrated = useSuperAdminStore((s) => s.hydrated);

    const login = useSuperAdminLogin();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // If already logged in, redirect away
    useEffect(() => {
        if (hydrated && token) {
            router.replace("/admin/dashboard");
        }
    }, [hydrated, token, router]);

    if (!hydrated) return null;
    if (token) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Super Admin Login</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm">Email</label>
                        <Input
                            placeholder="admin@example.com"
                            value={email}
                            autoComplete="email"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm">Password</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            autoComplete="current-password"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {login.isError && (
                        <p className="text-sm text-red-600">
                            {(login.error as Error)?.message || "Login failed"}
                        </p>
                    )}

                    <Button
                        className="w-full"
                        disabled={login.isPending || email.trim() === "" || password.trim() === ""}
                        onClick={async () => {
                            try {
                                await login.mutateAsync({
                                    email: email.trim().toLowerCase(),
                                    password,
                                });

                                router.replace("/admin/dashboard");
                            } catch {
                                // handled by React Query state
                            }
                        }}
                    >
                        {login.isPending ? "Signing in..." : "Login"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
