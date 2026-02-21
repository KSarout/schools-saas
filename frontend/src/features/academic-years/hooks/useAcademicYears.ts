import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createAcademicYear,
    deactivateAcademicYear,
    getAcademicYear,
    listAcademicYears,
    setCurrentAcademicYear,
    updateAcademicYear,
} from "@/features/academic-years/api/academicYears.api";
import type {
    CreateAcademicYearPayload,
    ListAcademicYearsParams,
    UpdateAcademicYearPayload,
} from "@/features/academic-years/api/academicYears.dto";
import { academicYearsKeys } from "@/features/academic-years/hooks/academicYears.keys";

export function useAcademicYearsList(params: ListAcademicYearsParams) {
    return useQuery({
        queryKey: academicYearsKeys.list(params),
        queryFn: () => listAcademicYears(params),
        placeholderData: keepPreviousData,
        retry: false,
    });
}

export function useAcademicYearDetail(id: string) {
    return useQuery({
        queryKey: academicYearsKeys.detail(id),
        queryFn: () => getAcademicYear(id),
        enabled: !!id,
        retry: false,
    });
}

export function useCreateAcademicYear() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateAcademicYearPayload) => createAcademicYear(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: academicYearsKeys.lists() });
        },
    });
}

export function useUpdateAcademicYear() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateAcademicYearPayload }) =>
            updateAcademicYear(id, payload),
        onSuccess: async (_updated, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: academicYearsKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: academicYearsKeys.detail(variables.id) }),
            ]);
        },
    });
}

export function useSetCurrentAcademicYear() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => setCurrentAcademicYear(id),
        onSuccess: async (_updated, id) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: academicYearsKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: academicYearsKeys.details() }),
                queryClient.invalidateQueries({ queryKey: academicYearsKeys.detail(id) }),
            ]);
        },
    });
}

export function useDeactivateAcademicYear() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deactivateAcademicYear(id),
        onSuccess: async (_result, id) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: academicYearsKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: academicYearsKeys.detail(id) }),
            ]);
        },
    });
}
