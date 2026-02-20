import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SchoolUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    mustChangePassword?: boolean;
};

export type SchoolTenant = {
    id: string;
    name: string;
    slug: string;
};

export type LoginPayload = {
    token: string;
    refreshToken: string;
    tenantSlug: string;
    user?: SchoolUser;
    tenant?: SchoolTenant;
};

export type SchoolAuthState = {
    hydrated: boolean;

    token: string | null;
    refreshToken: string | null;
    tenantSlug: string | null;

    user: SchoolUser | null;
    tenant: SchoolTenant | null;

    setHydrated: () => void;

    setToken: (token: string | null) => void;
    setRefreshToken: (token: string | null) => void;
    setTenantSlug: (slug: string | null) => void;

    login: (payload: LoginPayload) => void;
    logout: () => void;
};

function normalizeTenantSlug(slug: string) {
    return slug.trim().toLowerCase();
}

export const useSchoolAuthStore = create<SchoolAuthState>()(
    persist(
        (set) => ({
            hydrated: false,

            token: null,
            refreshToken: null,
            tenantSlug: null,

            user: null,
            tenant: null,

            setHydrated: () => set({ hydrated: true }),

            setToken: (token) =>
                set({
                    token,
                    // enterprise: if token is cleared, also clear cached identity
                    ...(token ? null : { refreshToken: null, user: null, tenant: null }),
                }),

            setRefreshToken: (refreshToken) =>
                set({
                    refreshToken,
                }),

            setTenantSlug: (slug) =>
                set({
                    tenantSlug: slug ? normalizeTenantSlug(slug) : null,
                }),

            login: ({ token, refreshToken, tenantSlug, user, tenant }) =>
                set({
                    hydrated: true, // makes login UX immediate
                    token,
                    refreshToken,
                    tenantSlug: normalizeTenantSlug(tenantSlug),
                    user: user ?? null,
                    tenant: tenant ?? null,
                }),

            logout: () =>
                set({
                    token: null,
                    refreshToken: null,
                    tenantSlug: null,
                    user: null,
                    tenant: null,
                }),
        }),
        {
            name: "school-auth",
            partialize: (s) => ({
                token: s.token,
                refreshToken: s.refreshToken,
                tenantSlug: s.tenantSlug,
                user: s.user,
                tenant: s.tenant,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);

// Optional selector helpers (nice pattern)
export const selectIsAuthed = (s: SchoolAuthState) => s.hydrated && !!s.token;
