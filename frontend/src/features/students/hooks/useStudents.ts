import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createStudent, deleteStudent, getStudent, listStudents, updateStudent } from "../api/students.api";
import type { StudentCreateInput, StudentUpdateInput } from "../api/students.dto";

export const studentKeys = {
    all: ["students"] as const,
    list: (args: { q?: string; page: number; limit: number }) => [...studentKeys.all, "list", args] as const,
    detail: (id: string) => [...studentKeys.all, "detail", id] as const,
};

export function useStudentList(args: { q?: string; page: number; limit: number }) {
    return useQuery({
        queryKey: studentKeys.list(args),
        queryFn: () => listStudents(args),
        placeholderData: keepPreviousData,
        retry: false,
    });
}

export function useStudentDetail(id: string) {
    return useQuery({
        queryKey: studentKeys.detail(id),
        queryFn: () => getStudent(id),
        enabled: !!id,
        retry: false,
    });
}

export function useCreateStudent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: StudentCreateInput) => createStudent(input),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: studentKeys.all });
        },
    });
}

export function useUpdateStudent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: StudentUpdateInput }) => updateStudent(id, input),
        onSuccess: async (updated) => {
            // update profile cache
            qc.setQueryData(studentKeys.detail(updated.id), updated);
            // refresh lists (search/pagination combos)
            await qc.invalidateQueries({ queryKey: studentKeys.all });
        },
    });
}

export function useDeleteStudent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteStudent(id),
        onSuccess: async (_ok, id) => {
            qc.removeQueries({ queryKey: studentKeys.detail(id) });
            await qc.invalidateQueries({ queryKey: studentKeys.all });
        },
    });
}
