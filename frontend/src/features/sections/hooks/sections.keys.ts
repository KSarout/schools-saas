import type { ListSectionsParams } from "@/features/sections/api/sections.dto";

export const sectionsKeys = {
    all: ["sections"] as const,
    lists: () => [...sectionsKeys.all, "list"] as const,
    list: (params: ListSectionsParams) => [...sectionsKeys.lists(), params] as const,
    details: () => [...sectionsKeys.all, "detail"] as const,
    detail: (id: string) => [...sectionsKeys.details(), id] as const,
};
