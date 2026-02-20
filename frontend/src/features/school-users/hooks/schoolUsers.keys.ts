import type { ListSchoolUsersParams } from "@/features/school-users/api/schoolUsers.dto";

export const schoolUsersKeys = {
    all: ["school-users"] as const,
    lists: () => [...schoolUsersKeys.all, "list"] as const,
    list: (params: ListSchoolUsersParams) => [...schoolUsersKeys.lists(), params] as const,
    details: () => [...schoolUsersKeys.all, "detail"] as const,
    detail: (id: string) => [...schoolUsersKeys.details(), id] as const,
};
