import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, listUsers, resetUserPassword, updateUser } from "@/features/users/api/users.api";
import type { CreateUserPayload, ListUsersParams, UpdateUserPayload } from "@/features/users/dto/users.dto";
import { usersKeys } from "@/features/users/queryKeys";

export function useUsersList(params: ListUsersParams) {
    return useQuery({
        queryKey: usersKeys.list(params),
        queryFn: () => listUsers(params),
        placeholderData: keepPreviousData,
        retry: false,
    });
}

export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateUserPayload) => createUser(payload),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: usersKeys.all });
        },
    });
}

export function useUpdateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => updateUser(id, payload),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: usersKeys.all });
        },
    });
}

export function useResetUserPassword() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => resetUserPassword(id),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: usersKeys.all });
        },
    });
}
