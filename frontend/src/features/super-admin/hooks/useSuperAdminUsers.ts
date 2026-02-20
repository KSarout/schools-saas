"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminApi } from "@/features/super-admin/api/superAdmin.api";
import {
    type CreateSuperAdminUserPayload,
    type ListSuperAdminUsersParams,
    type UpdateSuperAdminUserPayload,
} from "@/features/super-admin/api/uperAdmin.dto";
import { superAdminKeys } from "@/features/super-admin/queryKeys";

export function useSuperAdminUsers(params: ListSuperAdminUsersParams) {
    return useQuery({
        queryKey: superAdminKeys.users(params),
        queryFn: () => superAdminApi.users(params),
        placeholderData: keepPreviousData,
        retry: false,
    });
}

export function useCreateSuperAdminUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateSuperAdminUserPayload) => superAdminApi.createUser(payload),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["super-admin", "users"] });
        },
    });
}

export function useUpdateSuperAdminUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateSuperAdminUserPayload }) =>
            superAdminApi.updateUser(id, payload),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["super-admin", "users"] });
        },
    });
}

export function useResetSuperAdminUserPassword() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => superAdminApi.resetUserPassword(id),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["super-admin", "users"] });
        },
    });
}
