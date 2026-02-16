import { create } from "zustand";
import { persist } from "zustand/middleware";

type SuperAdminStore = {
    token: string | null;
    hydrated: boolean;
    setToken: (token: string | null) => void;
    logout: () => void;
    setHydrated: () => void;
};

export const useSuperAdminStore = create<SuperAdminStore>()(
    persist(
        (set) => ({
            token: null,
            hydrated: false,

            setToken: (token) => set({ token }),
            logout: () => set({ token: null }),

            setHydrated: () => set({ hydrated: true }),
        }),
        {
            name: "super-admin-auth",
            partialize: (s) => ({ token: s.token }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);
