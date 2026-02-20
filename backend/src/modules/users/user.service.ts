import type { Types } from "mongoose";
import { randomBytes } from "node:crypto";
import { buildListResponse, type ListResponse } from "../../core/listResponse";
import { hashPassword } from "../../utils/password";
import { toUserDto } from "./dto/user.dto";
import type { SchoolRole } from "./model/user.model";
import {
    countUsersForTenant,
    createUserForTenant,
    findUserByEmail,
    findUserById,
    listUsersForTenant,
} from "./service/user.repo";
import { buildUserListFilter, userListSort } from "./service/user.search";

type TenantId = Types.ObjectId | string;

export type SchoolUsersFilters = {
    q?: string;
    role?: SchoolRole;
    status?: "ACTIVE" | "INACTIVE";
};

export type CreateUserPayload = {
    name: string;
    email: string;
    role: SchoolRole;
};

export type UpdateUserPatch = {
    name?: string;
    role?: SchoolRole;
    isActive?: boolean;
};

function generateTempPassword() {
    return randomBytes(12).toString("base64url");
}

function notFoundError() {
    const err = new Error("User not found");
    (err as any).status = 404;
    return err;
}

export async function listUsers(
    tenantId: TenantId,
    filters: SchoolUsersFilters,
    page: number,
    limit: number
): Promise<ListResponse<ReturnType<typeof toUserDto>>> {
    const filter = buildUserListFilter(filters);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        listUsersForTenant(tenantId, filter)
            .sort(userListSort)
            .skip(skip)
            .limit(limit)
            .lean(),
        countUsersForTenant(tenantId, filter),
    ]);

    return buildListResponse({
        items: items.map(toUserDto),
        total,
        page,
        limit,
    });
}

export async function createUserWithTempPassword(tenantId: TenantId, payload: CreateUserPayload) {
    const email = payload.email.trim().toLowerCase();
    const existing = await findUserByEmail(tenantId, email);
    if (existing) {
        const err = new Error("User email already exists");
        (err as any).status = 409;
        throw err;
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const created = await createUserForTenant(tenantId, {
        name: payload.name.trim(),
        email,
        role: payload.role,
        passwordHash,
        isActive: true,
        mustChangePassword: true,
    });

    return {
        user: toUserDto(created),
        tempPassword,
    };
}

export async function updateUser(tenantId: TenantId, userId: string, patch: UpdateUserPatch) {
    const user = await findUserById(tenantId, userId);
    if (!user) throw notFoundError();

    if (patch.name !== undefined) user.name = patch.name.trim();
    if (patch.role !== undefined) user.role = patch.role;
    if (patch.isActive !== undefined) user.isActive = patch.isActive;
    await user.save();

    return toUserDto(user);
}

export async function resetUserPassword(tenantId: TenantId, userId: string) {
    const user = await findUserById(tenantId, userId);
    if (!user) throw notFoundError();

    const tempPassword = generateTempPassword();
    user.passwordHash = await hashPassword(tempPassword);
    user.mustChangePassword = true;
    await user.save();

    return { tempPassword };
}

export async function deactivateUser(tenantId: TenantId, userId: string) {
    const user = await findUserById(tenantId, userId);
    if (!user) throw notFoundError();

    user.isActive = false;
    await user.save();

    return { ok: true as const };
}
