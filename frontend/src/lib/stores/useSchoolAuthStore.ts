import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SchoolRole = "SCHOOL_ADMIN" | "TEACHER" | "ACCOUNTANT";

export type SchoolUser = {
    id: string;
    name: string;
    email: string;
    role: SchoolRole;
    mustChangePassword?: boolean;
};

type SchoolAuthState = {
    token: string | null;
    tenantSlug: string | null;
    hydrated: boolean;

    // Optional cached profile (useful for UI)
    user: SchoolUser | null;
    tenant: { id: string; name: string; slug: string } | null;
};

type SchoolAuthActions = {
    setTenantSlug: (slug: string) => void;

    // Called after /auth/login success
    login: (args: {
        token: string;
        tenantSlug: string;
        user?: SchoolUser | null;
        tenant?: { id: string; name: string; slug: string } | null;
    }) => void;

    // Used after /auth/me to store profile info
    setProfile: (args: {
        user: SchoolUser | null;
        tenant: { id: string; name: string; slug: string } | null;
    }) => void;

    logout: () => void;

    setHydrated: () => void;
};

export type SchoolAuthStore = SchoolAuthState & SchoolAuthActions;

export const useSchoolAuthStore = create<SchoolAuthStore>()(
    persist(
        (set, get) => ({
            token: null,
            tenantSlug: null,
            hydrated: false,

            user: null,
            tenant: null,

            setTenantSlug: (slug: string) => {
                set({ tenantSlug: slug.trim().toLowerCase() });
            },

            login: ({ token, tenantSlug, user, tenant }) => {
                set({
                    token,
                    tenantSlug: tenantSlug.trim().toLowerCase(),
                    user: user ?? null,
                    tenant: tenant ?? null,
                });
            },

            setProfile: ({ user, tenant }) => {
                set({
                    user,
                    tenant,
                });
            },

            logout: () => {
                set({
                    token: null,
                    tenantSlug: null,
                    user: null,
                    tenant: null,
                });
            },

            setHydrated: () => set({ hydrated: true }),
        }),
        {
            name: "school-auth",
            // Only persist what we need to survive reload
            partialize: (state) => ({
                token: state.token,
                tenantSlug: state.tenantSlug,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);
