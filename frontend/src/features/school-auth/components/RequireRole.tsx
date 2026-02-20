"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import type { SchoolRole } from "@/features/school-auth/api/schoolAuth.api";
import { useSchoolMe } from "@/features/school-auth/hooks/useSchoolAuth";

type Props = {
    allow: SchoolRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
};

export function RequireRole({ allow, children, fallback }: Props) {
    const params = useParams<{ locale: string }>();
    const locale = params.locale;

    const me = useSchoolMe();
    const role = me.data?.user?.role;

    const ok = useMemo(() => {
        if (!role) return false;
        return allow.includes(role);
    }, [role, allow]);

    if (ok) return <>{children}</>;

    return (
        <>
            {fallback ?? (
                <div className="p-6">
                    <div className="text-sm text-muted-foreground">
                        You don’t have permission to view this page.{" "}
                        <Link className="underline underline-offset-4" href={`/${locale}/school/dashboard`}>
                            Go back
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
