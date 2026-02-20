import { escapeRegex } from "../../../core/regex";
import type { SchoolRole } from "../model/user.model";

type UserStatusFilter = "ACTIVE" | "INACTIVE";

export const userListSort = { createdAt: -1 as const, _id: -1 as const };

export function buildUserListFilter(params: {
    q?: string;
    role?: SchoolRole;
    status?: UserStatusFilter;
}) {
    const filter: Record<string, unknown> = {};
    if (params.role) filter.role = params.role;
    if (params.status) filter.isActive = params.status === "ACTIVE";

    if (!params.q?.trim()) {
        return filter;
    }

    const query = params.q.trim().toLowerCase();
    const safePrefix = `^${escapeRegex(query)}`;
    filter.$or = [
        { nameSearch: { $regex: safePrefix } },
        { emailSearch: { $regex: safePrefix } },
    ];

    return filter;
}
