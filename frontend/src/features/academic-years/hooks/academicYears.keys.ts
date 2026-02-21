import type { ListAcademicYearsParams } from "@/features/academic-years/api/academicYears.dto";

export const academicYearsKeys = {
    all: ["academic-years"] as const,
    lists: () => [...academicYearsKeys.all, "list"] as const,
    list: (params: ListAcademicYearsParams) => [...academicYearsKeys.lists(), params] as const,
    details: () => [...academicYearsKeys.all, "detail"] as const,
    detail: (id: string) => [...academicYearsKeys.details(), id] as const,
};
