import {ListStudentsResponse} from "@/features/students/students.dto";

export const studentsKeys = {
    all: ["students"] as const,
    lists: () => [...studentsKeys.all, "list"] as const,
    list: (params: ListStudentsResponse) => [...studentsKeys.lists(), params] as const,
};
