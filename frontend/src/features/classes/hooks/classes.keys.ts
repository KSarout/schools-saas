import type { ListClassesParams } from "@/features/classes/api/classes.dto";

export const classesKeys = {
    all: ["classes"] as const,
    lists: () => [...classesKeys.all, "list"] as const,
    list: (params: ListClassesParams) => [...classesKeys.lists(), params] as const,
    details: () => [...classesKeys.all, "detail"] as const,
    detail: (id: string) => [...classesKeys.details(), id] as const,
};
