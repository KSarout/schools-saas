import { create } from "zustand"

type TenantState = {
    tenantId: string | null
    setTenantId: (id: string) => void
}

export const useTenantStore = create<TenantState>((set) => ({
    tenantId: null,
    setTenantId: (id) => {
        localStorage.setItem("tenant_id", id)
        set({ tenantId: id })
    },
}))