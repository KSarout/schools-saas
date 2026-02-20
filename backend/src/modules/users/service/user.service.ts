import type { Types } from "mongoose";
import { randomBytes } from "node:crypto";
import { buildListResponse, type ListResponse } from "../../../core/listResponse";
import { hashPassword } from "../../../utils/password";
import { toUserDto } from "../dto/user.dto";
import type { SchoolRole } from "../model/user.model";
import {
    countUsersForTenant,
    createUserForTenant,
    findUserByEmail,
    findUserById,
    listUsersForTenant,
} from "./user.repo";
import { buildUserListFilter, userListSort } from "./user.search";

type TenantId = Types.ObjectId | string;

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

export type ListUsersInput = {
    q?: string;
    role?: SchoolRole;
    status?: "ACTIVE" | "INACTIVE";
    page: number;
    limit: number;
};

function generateTempPassword() {
    return randomBytes(12).toString("base64url");
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

export async function resetUserPassword(tenantId: TenantId, userId: string) {
    const user = await findUserById(tenantId, userId);
    if (!user) {
        const err = new Error("User not found");
        (err as any).status = 404;
        throw err;
    }

    const tempPassword = generateTempPassword();
    user.passwordHash = await hashPassword(tempPassword);
    user.mustChangePassword = true;
    await user.save();

    return {
        user: toUserDto(user),
        tempPassword,
    };
}

export async function updateUser(tenantId: TenantId, userId: string, patch: UpdateUserPatch) {
    const user = await findUserById(tenantId, userId);
    if (!user) {
        const err = new Error("User not found");
        (err as any).status = 404;
        throw err;
    }

    if (patch.name !== undefined) user.name = patch.name.trim();
    if (patch.role !== undefined) user.role = patch.role;
    if (patch.isActive !== undefined) user.isActive = patch.isActive;

    await user.save();
    return toUserDto(user);
}

export async function listUsers(
    tenantId: TenantId,
    filters: Omit<ListUsersInput, "page" | "limit">,
    pagination: Pick<ListUsersInput, "page" | "limit">
): Promise<ListResponse<ReturnType<typeof toUserDto>>> {
    const filter = buildUserListFilter(filters);
    const skip = (pagination.page - 1) * pagination.limit;

    const [items, total] = await Promise.all([
        listUsersForTenant(tenantId, filter)
            .sort(userListSort)
            .skip(skip)
            .limit(pagination.limit)
            .lean(),
        countUsersForTenant(tenantId, filter),
    ]);

    return buildListResponse({
        items: items.map(toUserDto),
        total,
        page: pagination.page,
        limit: pagination.limit,
    });
}
