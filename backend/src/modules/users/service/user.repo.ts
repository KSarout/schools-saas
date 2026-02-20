import type { Types } from "mongoose";
import { tenantCountDocuments, tenantCreate, tenantFind, tenantFindOne } from "../../../core/tenantModel";
import { UserModel, type SchoolRole } from "../model/user.model";

type TenantId = Types.ObjectId | string;

export function findActiveUserByEmail(tenantId: TenantId, email: string) {
    return tenantFindOne(
        UserModel,
        {
            email,
            isActive: true,
        },
        { tenantId }
    );
}

export function findActiveUserById(tenantId: TenantId, userId: TenantId) {
    return tenantFindOne(
        UserModel,
        {
            _id: userId,
            isActive: true,
        },
        { tenantId }
    );
}

export function findUserById(tenantId: TenantId, userId: TenantId) {
    return tenantFindOne(
        UserModel,
        {
            _id: userId,
        },
        { tenantId }
    );
}

export function findUserByRole(tenantId: TenantId, role: SchoolRole) {
    return tenantFindOne(
        UserModel,
        {
            role,
        },
        { tenantId }
    );
}

export function findUserByEmail(tenantId: TenantId, email: string) {
    return tenantFindOne(
        UserModel,
        {
            email,
        },
        { tenantId }
    );
}

export function listUsersForTenant(tenantId: TenantId, filter: Record<string, unknown>) {
    return tenantFind(UserModel, filter, { tenantId });
}

export function countUsersForTenant(tenantId: TenantId, filter: Record<string, unknown>) {
    return tenantCountDocuments(UserModel, filter, { tenantId });
}

export function createUserForTenant(
    tenantId: TenantId,
    data: {
        name: string;
        email: string;
        role: SchoolRole;
        passwordHash: string;
        mustChangePassword: boolean;
        isActive: boolean;
    }
) {
    return tenantCreate(UserModel, data, { tenantId });
}
