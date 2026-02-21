import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createSection,
    deactivateSection,
    getSectionById,
    listSections,
    updateSection,
} from "@/features/sections/api/sections.api";
import type {
    CreateSectionPayload,
    ListSectionsParams,
    UpdateSectionPayload,
} from "@/features/sections/api/sections.dto";
import { sectionsKeys } from "@/features/sections/hooks/sections.keys";

export function useSectionsList(params: ListSectionsParams) {
    return useQuery({
        queryKey: sectionsKeys.list(params),
        queryFn: () => listSections(params),
        placeholderData: keepPreviousData,
        retry: false,
    });
}

export function useSectionDetail(id: string) {
    return useQuery({
        queryKey: sectionsKeys.detail(id),
        queryFn: () => getSectionById(id),
        enabled: !!id,
        retry: false,
    });
}

export function useCreateSection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateSectionPayload) => createSection(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: sectionsKeys.lists() });
        },
    });
}

export function useUpdateSection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateSectionPayload }) => updateSection(id, payload),
        onSuccess: async (_updated, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: sectionsKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: sectionsKeys.detail(variables.id) }),
            ]);
        },
    });
}

export function useDeactivateSection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deactivateSection(id),
        onSuccess: async (_result, id) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: sectionsKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: sectionsKeys.detail(id) }),
            ]);
        },
    });
}
