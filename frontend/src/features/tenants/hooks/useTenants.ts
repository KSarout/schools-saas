import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export type TenantDto = {
    id: string
    name: string
    code?: string
}

export function useTenants() {
    return useQuery({
        queryKey: ["tenants"],
        queryFn: async () => {
            const res = await api.get("/admin/tenants")
            return res.data as TenantDto[]
        },
    })
}
