import test from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

import { signSchoolAccessToken } from "../../../utils/jwt";
import { schoolAuth } from "../../../middlewares/schoolAuth";
import { requireSchoolPermission } from "../../../middlewares/rbac";
import {
    createUserHandler,
    deleteUserHandler,
    listUsersHandler,
    resetUserPasswordHandler,
    updateUserHandler,
} from "../user.routes";
import * as userService from "../user.service";
import * as userAuditService from "../service/userAudit.service";
import * as userRepo from "../service/user.repo";

const TENANT_A = "67f1f77bcf86cd7994390a11";
const TENANT_B = "67f1f77bcf86cd7994390b22";

function createMockResponse() {
    const state: { statusCode?: number; payload?: unknown } = {};
    const res = {
        status(code: number) {
            state.statusCode = code;
            return res;
        },
        json(payload: unknown) {
            state.payload = payload;
            return res;
        },
    } as unknown as Response;

    return { res, state };
}

function createRequest(params: {
    method: string;
    role: "SCHOOL_ADMIN" | "ACCOUNTANT" | "TEACHER";
    tenantId: string;
    userId: string;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    routeParams?: Record<string, string>;
}) {
    const token = signSchoolAccessToken({
        userId: params.userId,
        tenantId: params.tenantId,
        role: params.role,
    });

    return {
        method: params.method,
        query: params.query ?? {},
        body: params.body ?? {},
        params: params.routeParams ?? {},
        header(name: string) {
            return name === "Authorization" ? `Bearer ${token}` : undefined;
        },
    } as unknown as Request;
}

function runAuth(req: Request, res: Response) {
    let called = false;
    const next: NextFunction = () => {
        called = true;
    };
    schoolAuth(req, res, next);
    return called;
}

function runPermission(permission: Parameters<typeof requireSchoolPermission>[0], req: Request, res: Response) {
    const middleware = requireSchoolPermission(permission);
    let called = false;
    const next: NextFunction = () => {
        called = true;
    };
    middleware(req, res, next);
    return called;
}

test("tenant isolation: list handler uses caller tenantId and returns scoped items", async () => {
    const originalListUsers = userService.listUsers;
    let seenTenantId = "";

    (userService as any).listUsers = async (tenantId: Types.ObjectId) => {
        seenTenantId = tenantId.toString();
        return {
            items: [{ id: "u-a1", name: "Tenant A", email: "a@school.test", role: "TEACHER", isActive: true }],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
        };
    };

    try {
        const req = createRequest({
            method: "GET",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a33",
            query: { page: "1", limit: "10" },
        });
        const { res, state } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runPermission("users.list", req, res), true);
        await listUsersHandler(req, res);

        assert.equal(seenTenantId, TENANT_A);
        assert.equal((state.payload as any).total, 1);
        assert.equal((state.payload as any).items[0].id, "u-a1");
    } finally {
        (userService as any).listUsers = originalListUsers;
    }
});

test("tenant isolation: tenant A cannot patch tenant B user", async () => {
    const originalFindUserById = userRepo.findUserById;
    const originalUpdateUser = userService.updateUser;
    (userRepo as any).findUserById = async () => ({
        _id: "67f1f77bcf86cd7994390b55",
        role: "TEACHER",
        isActive: true,
    });
    (userService as any).updateUser = async () => {
        const err = new Error("User not found");
        (err as any).status = 404;
        throw err;
    };

    try {
        const req = createRequest({
            method: "PATCH",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a44",
            routeParams: { id: "67f1f77bcf86cd7994390b55" },
            body: { name: "Updated Name" },
        });
        const { res, state } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runPermission("users.update", req, res), true);
        await updateUserHandler(req, res);

        assert.equal(state.statusCode, 404);
        assert.deepEqual(state.payload, { error: "User not found" });
    } finally {
        (userRepo as any).findUserById = originalFindUserById;
        (userService as any).updateUser = originalUpdateUser;
    }
});

test("RBAC: teacher can list users", async () => {
    const req = createRequest({
        method: "GET",
        role: "TEACHER",
        tenantId: TENANT_A,
        userId: "67f1f77bcf86cd7994390aaa",
        query: { page: "1", limit: "10" },
    });
    const { res } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runPermission("users.list", req, res), true);
});

test("RBAC: teacher cannot create users", async () => {
    const req = createRequest({
        method: "POST",
        role: "TEACHER",
        tenantId: TENANT_A,
        userId: "67f1f77bcf86cd7994390a66",
        body: { name: "Teacher Two", email: "teacher2@school.test", role: "TEACHER" },
    });
    const { res, state } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runPermission("users.create", req, res), false);
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.payload, { error: "Forbidden" });
});

test("RBAC: teacher cannot edit users", async () => {
    const req = createRequest({
        method: "PATCH",
        role: "TEACHER",
        tenantId: TENANT_A,
        userId: "67f1f77bcf86cd7994390a77",
        routeParams: { id: "67f1f77bcf86cd7994390a88" },
        body: { name: "Nope" },
    });
    const { res, state } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runPermission("users.update", req, res), false);
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.payload, { error: "Forbidden" });
});

test("RBAC: teacher cannot reset user password", async () => {
    const req = createRequest({
        method: "POST",
        role: "TEACHER",
        tenantId: TENANT_B,
        userId: "67f1f77bcf86cd7994390b66",
        routeParams: { id: "67f1f77bcf86cd7994390b77" },
    });
    const { res, state } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runPermission("users.resetPassword", req, res), false);
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.payload, { error: "Forbidden" });
});

test("RBAC: teacher cannot delete users", async () => {
    const req = createRequest({
        method: "DELETE",
        role: "TEACHER",
        tenantId: TENANT_A,
        userId: "67f1f77bcf86cd7994390a89",
        routeParams: { id: "67f1f77bcf86cd7994390a90" },
    });
    const { res, state } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runPermission("users.delete", req, res), false);
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.payload, { error: "Forbidden" });
});

test("create user writes audit action USER_CREATED", async () => {
    const originalCreate = userService.createUserWithTempPassword;
    const originalAudit = userAuditService.logUserAuditAction;
    let auditAction: any = null;

    (userService as any).createUserWithTempPassword = async () => ({
        user: {
            id: "67f1f77bcf86cd7994390aff",
            name: "New User",
            email: "new@school.test",
            role: "TEACHER",
            isActive: true,
            mustChangePassword: true,
        },
        tempPassword: "temp-secret",
    });
    (userAuditService as any).logUserAuditAction = async (params: unknown) => {
        auditAction = params;
    };

    try {
        const req = createRequest({
            method: "POST",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a01",
            body: { name: "New User", email: "new@school.test", role: "TEACHER" },
        });
        const { res } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runPermission("users.create", req, res), true);
        await createUserHandler(req, res);

        assert.equal((auditAction as any).action, "USER_CREATED");
        assert.equal(String((auditAction as any).targetUserId), "67f1f77bcf86cd7994390aff");
    } finally {
        (userService as any).createUserWithTempPassword = originalCreate;
        (userAuditService as any).logUserAuditAction = originalAudit;
    }
});

test("reset password writes audit action USER_PASSWORD_RESET", async () => {
    const originalResetPassword = userService.resetUserPassword;
    const originalAudit = userAuditService.logUserAuditAction;
    let auditAction: any = null;

    (userService as any).resetUserPassword = async () => ({ tempPassword: "new-temp" });
    (userAuditService as any).logUserAuditAction = async (params: unknown) => {
        auditAction = params;
    };

    try {
        const req = createRequest({
            method: "POST",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a04",
            routeParams: { id: "67f1f77bcf86cd7994390add" },
        });
        const { res } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runPermission("users.resetPassword", req, res), true);
        await resetUserPasswordHandler(req, res);

        assert.equal((auditAction as any).action, "USER_PASSWORD_RESET");
        assert.equal(String((auditAction as any).targetUserId), "67f1f77bcf86cd7994390add");
    } finally {
        (userService as any).resetUserPassword = originalResetPassword;
        (userAuditService as any).logUserAuditAction = originalAudit;
    }
});

test("deactivate user writes audit action USER_DEACTIVATED", async () => {
    const originalFindUserById = userRepo.findUserById;
    const originalDeactivate = userService.deactivateUser;
    const originalAudit = userAuditService.logUserAuditAction;
    let auditAction: any = null;

    (userRepo as any).findUserById = async () => ({
        _id: "67f1f77bcf86cd7994390aee",
        role: "TEACHER",
        isActive: true,
    });
    (userService as any).deactivateUser = async () => ({ ok: true });
    (userAuditService as any).logUserAuditAction = async (params: unknown) => {
        auditAction = params;
    };

    try {
        const req = createRequest({
            method: "DELETE",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a05",
            routeParams: { id: "67f1f77bcf86cd7994390aee" },
        });
        const { res, state } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runPermission("users.delete", req, res), true);
        await deleteUserHandler(req, res);

        assert.deepEqual(state.payload, { ok: true });
        assert.equal((auditAction as any).action, "USER_DEACTIVATED");
        assert.equal(String((auditAction as any).targetUserId), "67f1f77bcf86cd7994390aee");
    } finally {
        (userRepo as any).findUserById = originalFindUserById;
        (userService as any).deactivateUser = originalDeactivate;
        (userAuditService as any).logUserAuditAction = originalAudit;
    }
});

test("invalid ObjectId param returns 400", async () => {
    const req = createRequest({
        method: "PATCH",
        role: "ACCOUNTANT",
        tenantId: TENANT_A,
        userId: "67f1f77bcf86cd7994390acd",
        routeParams: { id: "not-an-object-id" },
        body: { name: "Invalid Id" },
    });
    const { res, state } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runPermission("users.update", req, res), true);
    await updateUserHandler(req, res);

    assert.equal(state.statusCode, 400);
    assert.deepEqual(state.payload, { error: "Invalid user id" });
});

test("patch blocks removing last active admin", async () => {
    const originalFindUserById = userRepo.findUserById;
    const originalCountUsersForTenant = userRepo.countUsersForTenant;
    const originalUpdateUser = userService.updateUser;
    let updateCalled = false;

    (userRepo as any).findUserById = async () => ({
        _id: "67f1f77bcf86cd7994390a10",
        role: "SCHOOL_ADMIN",
        isActive: true,
    });
    (userRepo as any).countUsersForTenant = async () => 1;
    (userService as any).updateUser = async () => {
        updateCalled = true;
        return {};
    };

    try {
        const req = createRequest({
            method: "PATCH",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a11",
            routeParams: { id: "67f1f77bcf86cd7994390a10" },
            body: { role: "TEACHER" },
        });
        const { res, state } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runPermission("users.update", req, res), true);
        await updateUserHandler(req, res);

        assert.equal(state.statusCode, 400);
        assert.deepEqual(state.payload, { error: "Cannot remove last admin" });
        assert.equal(updateCalled, false);
    } finally {
        (userRepo as any).findUserById = originalFindUserById;
        (userRepo as any).countUsersForTenant = originalCountUsersForTenant;
        (userService as any).updateUser = originalUpdateUser;
    }
});

test("delete blocks deactivating last active admin", async () => {
    const originalFindUserById = userRepo.findUserById;
    const originalCountUsersForTenant = userRepo.countUsersForTenant;
    const originalDeactivateUser = userService.deactivateUser;
    let deactivateCalled = false;

    (userRepo as any).findUserById = async () => ({
        _id: "67f1f77bcf86cd7994390a20",
        role: "SCHOOL_ADMIN",
        isActive: true,
    });
    (userRepo as any).countUsersForTenant = async () => 1;
    (userService as any).deactivateUser = async () => {
        deactivateCalled = true;
        return { ok: true };
    };

    try {
        const req = createRequest({
            method: "DELETE",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a21",
            routeParams: { id: "67f1f77bcf86cd7994390a20" },
        });
        const { res, state } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runPermission("users.delete", req, res), true);
        await deleteUserHandler(req, res);

        assert.equal(state.statusCode, 400);
        assert.deepEqual(state.payload, { error: "Cannot remove last admin" });
        assert.equal(deactivateCalled, false);
    } finally {
        (userRepo as any).findUserById = originalFindUserById;
        (userRepo as any).countUsersForTenant = originalCountUsersForTenant;
        (userService as any).deactivateUser = originalDeactivateUser;
    }
});
