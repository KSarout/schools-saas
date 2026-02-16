"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { superAdminKeys } from "../queryKeys";
import { superAdminApi } from "../api/superAdmin.api";
import {CreateTenantPayload, ListTenantsParams} from "@/features/super-admin/api/uperAdmin.dto";

export function useTenants(params: ListTenantsParams) {
    return useQuery({
        queryKey: superAdminKeys.tenants(params),
        queryFn: () => superAdminApi.tenants(params),
        placeholderData: keepPreviousData, // v5 replacement for keepPreviousData:true
        retry: false,
    });
}

export function useCreateTenant() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateTenantPayload) => superAdminApi.createTenant(input),
        onSuccess: async () => {
            // invalidate ALL tenant lists, regardless of params
            await qc.invalidateQueries({ queryKey: ["super-admin", "tenants"] });
        },
    });
}

export function useResetTenantPassword() {
    return useMutation({
        mutationFn: (tenantId: string) =>
            superAdminApi.resetTenantAdminPassword({ tenantId }),
    });
}
