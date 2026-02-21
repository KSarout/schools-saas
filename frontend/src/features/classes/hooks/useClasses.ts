import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClass, deactivateClass, getClassById, listClasses, updateClass } from "@/features/classes/api/classes.api";
import type { CreateClassPayload, ListClassesParams, UpdateClassPayload } from "@/features/classes/api/classes.dto";
import { classesKeys } from "@/features/classes/hooks/classes.keys";

export function useClassesList(params: ListClassesParams) {
    return useQuery({
        queryKey: classesKeys.list(params),
        queryFn: () => listClasses(params),
        placeholderData: keepPreviousData,
        retry: false,
    });
}

export function useClassDetail(id: string) {
    return useQuery({
        queryKey: classesKeys.detail(id),
        queryFn: () => getClassById(id),
        enabled: !!id,
        retry: false,
    });
}

export function useCreateClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateClassPayload) => createClass(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: classesKeys.lists() });
        },
    });
}

export function useUpdateClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateClassPayload }) => updateClass(id, payload),
        onSuccess: async (_updated, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: classesKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: classesKeys.detail(variables.id) }),
            ]);
        },
    });
}

export function useDeactivateClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deactivateClass(id),
        onSuccess: async (_result, id) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: classesKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: classesKeys.detail(id) }),
            ]);
        },
    });
}
