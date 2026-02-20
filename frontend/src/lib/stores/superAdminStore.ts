import { create } from "zustand";
import { persist } from "zustand/middleware";

type SuperAdminStore = {
    token: string | null;
    refreshToken: string | null;
    hydrated: boolean;
    setToken: (token: string | null) => void;
    setRefreshToken: (refreshToken: string | null) => void;
    logout: () => void;
    setHydrated: () => void;
};

export const useSuperAdminStore = create<SuperAdminStore>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            hydrated: false,

            setToken: (token) => set({ token }),
            setRefreshToken: (refreshToken) => set({ refreshToken }),
            logout: () => set({ token: null, refreshToken: null }),

            setHydrated: () => set({ hydrated: true }),
        }),
        {
            name: "super-admin-auth",
            partialize: (s) => ({ token: s.token, refreshToken: s.refreshToken }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);
