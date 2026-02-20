import { escapeRegex } from "../../../core/regex";

export const tenantListSort = { createdAt: -1 as const, _id: -1 as const };

export function buildTenantListFilter(q?: string) {
    const query = q?.trim().toLowerCase();
    if (!query) return {};

    const safePrefix = `^${escapeRegex(query)}`;
    return {
        $or: [
            { nameSearch: { $regex: safePrefix } },
            { slugSearch: { $regex: safePrefix } },
        ],
    };
}
