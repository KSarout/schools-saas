"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import { useSchoolAuthStore } from "@/lib/stores/useSchoolAuthStore";
import { useSchoolMe } from "@/features/school-auth/hooks/useSchoolAuth";

type Props = {
    children: React.ReactNode;
};

export function SchoolGuard({ children }: Props) {
    const router = useRouter();
    const params = useParams<{ locale: string }>();
    const locale = params.locale;

    const hydrated = useSchoolAuthStore((s) => s.hydrated);
    const token = useSchoolAuthStore((s) => s.token);
    const tenantSlug = useSchoolAuthStore((s) => s.tenantSlug);
    const logout = useSchoolAuthStore((s) => s.logout);

    const loginUrl = useMemo(() => `/${locale}/school/login`, [locale]);
    const changePasswordUrl = useMemo(() => `/${locale}/school/change-password`, [locale]);

    // If no token, go login (only after hydration)
    useEffect(() => {
        if (hydrated && !token) router.replace(loginUrl);
    }, [hydrated, token, router, loginUrl]);

    // Fetch /me only when hydrated+token
    const meQuery = useSchoolMe();

    // If /me fails -> logout & go login (token invalid)
    useEffect(() => {
        if (meQuery.isError) {
            logout();
            router.replace(loginUrl);
        }
    }, [meQuery.isError, logout, router, loginUrl]);

    // Tenant safety: require tenantSlug exists (for SaaS isolation)
    useEffect(() => {
        if (hydrated && token && !tenantSlug) {
            // Something is inconsistent: token exists but no tenant => reset
            logout();
            router.replace(loginUrl);
        }
    }, [hydrated, token, tenantSlug, logout, router, loginUrl]);

    // Must change password gate
    const mustChangePassword = meQuery.data?.user?.mustChangePassword;

    useEffect(() => {
        if (hydrated && token && mustChangePassword === true) {
            router.replace(changePasswordUrl);
        }
    }, [hydrated, token, mustChangePassword, router, changePasswordUrl]);

    // Render gates
    if (!hydrated) return null;
    if (!token) return null;
    if (meQuery.isLoading) return null; // keep clean; later add skeleton
    if (mustChangePassword) return null;

    return <>{children}</>;
}
