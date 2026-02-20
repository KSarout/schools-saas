import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createUser,
    deactivateUser,
    listUsers,
    resetPassword,
    updateUser,
} from "@/features/school-users/api/schoolUsers.api";
import type {
    CreateSchoolUserPayload,
    ListSchoolUsersParams,
    UpdateSchoolUserPayload,
} from "@/features/school-users/api/schoolUsers.dto";
import { schoolUsersKeys } from "@/features/school-users/hooks/schoolUsers.keys";

export function useSchoolUsersList(params: ListSchoolUsersParams) {
    return useQuery({
        queryKey: schoolUsersKeys.list(params),
        queryFn: () => listUsers(params),
        placeholderData: keepPreviousData,
        retry: false,
    });
}

export function useCreateSchoolUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateSchoolUserPayload) => createUser(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: schoolUsersKeys.lists() });
        },
    });
}

export function useUpdateSchoolUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateSchoolUserPayload }) =>
            updateUser(id, payload),
        onSuccess: async (_updated, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: schoolUsersKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: schoolUsersKeys.detail(variables.id) }),
            ]);
        },
    });
}

export function useResetSchoolUserPassword() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => resetPassword(id),
        onSuccess: async (_result, id) => {
            await queryClient.invalidateQueries({ queryKey: schoolUsersKeys.detail(id) });
        },
    });
}

export function useDeactivateSchoolUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deactivateUser(id),
        onSuccess: async (_result, id) => {
            void id;
            await queryClient.invalidateQueries({ queryKey: schoolUsersKeys.lists() });
        },
    });
}
