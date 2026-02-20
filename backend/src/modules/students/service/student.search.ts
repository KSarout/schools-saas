import { escapeRegex } from "../../../core/regex";
import type { StudentStatus } from "../model/student.model";

export const studentListSort = { createdAt: -1 as const, _id: -1 as const };

function normalizeSearch(value: string) {
    return value.trim().toLowerCase();
}

export function buildStudentListFilter(params: {
    q?: string;
    status?: StudentStatus;
}) {
    const filter: Record<string, unknown> = {
        status: params.status ?? "ACTIVE",
    };

    if (!params.q?.trim()) {
        return filter;
    }

    const query = normalizeSearch(params.q);
    const safePrefix = `^${escapeRegex(query)}`;
    const looksLikeCode = query.startsWith("stu-");

    filter.$or = looksLikeCode
        ? [{ studentCodeSearch: { $regex: safePrefix } }]
        : [
            { studentCodeSearch: { $regex: safePrefix } },
            { studentIdSearch: { $regex: safePrefix } },
            { firstNameSearch: { $regex: safePrefix } },
            { lastNameSearch: { $regex: safePrefix } },
            { parentPhoneSearch: { $regex: safePrefix } },
        ];

    return filter;
}
