import type { ListUsersParams } from "@/features/users/dto/users.dto";

export const usersKeys = {
    all: ["users"] as const,
    list: (params: ListUsersParams) => [...usersKeys.all, "list", params] as const,
};
