import test from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";

import { requireSchoolPermission, requireSuperAdminPermission } from "./rbac";

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

test("school RBAC allows role with permission", () => {
    const middleware = requireSchoolPermission("students.list");
    const req = {
        user: { role: "TEACHER" },
    } as unknown as Request;
    const { res, state } = createMockResponse();

    let called = false;
    const next: NextFunction = () => {
        called = true;
    };

    middleware(req, res, next);

    assert.equal(called, true);
    assert.equal(state.statusCode, undefined);
});

test("school RBAC denies role without permission with consistent 403 shape", () => {
    const middleware = requireSchoolPermission("students.create");
    const req = {
        user: { role: "TEACHER" },
    } as unknown as Request;
    const { res, state } = createMockResponse();

    let called = false;
    const next: NextFunction = () => {
        called = true;
    };

    middleware(req, res, next);

    assert.equal(called, false);
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.payload, { error: "Forbidden" });
});

test("super-admin RBAC allows super-admin routes", () => {
    const middleware = requireSuperAdminPermission("superAdmin.tenants.list");
    const req = {
        superAdmin: { role: "SUPER_ADMIN" },
    } as unknown as Request;
    const { res, state } = createMockResponse();

    let called = false;
    const next: NextFunction = () => {
        called = true;
    };

    middleware(req, res, next);

    assert.equal(called, true);
    assert.equal(state.statusCode, undefined);
});

test("super-admin RBAC denies non-super-admin with consistent 403 shape", () => {
    const middleware = requireSuperAdminPermission("superAdmin.tenants.resetPassword");
    const req = {
        superAdmin: { role: "SCHOOL_ADMIN" },
    } as unknown as Request;
    const { res, state } = createMockResponse();

    let called = false;
    const next: NextFunction = () => {
        called = true;
    };

    middleware(req, res, next);

    assert.equal(called, false);
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.payload, { error: "Forbidden" });
});

test("super-admin RBAC allows users routes for super admin", () => {
    const middleware = requireSuperAdminPermission("superAdmin.users.list");
    const req = {
        superAdmin: { role: "SUPER_ADMIN" },
    } as unknown as Request;
    const { res, state } = createMockResponse();

    let called = false;
    const next: NextFunction = () => {
        called = true;
    };

    middleware(req, res, next);

    assert.equal(called, true);
    assert.equal(state.statusCode, undefined);
});

test("school RBAC allows school admin for users routes", () => {
    const middleware = requireSchoolPermission("users.list");
    const req = {
        user: { role: "SCHOOL_ADMIN" },
    } as unknown as Request;
    const { res } = createMockResponse();

    let called = false;
    const next: NextFunction = () => {
        called = true;
    };

    middleware(req, res, next);
    assert.equal(called, true);
});

test("school RBAC denies teacher for users routes", () => {
    const middleware = requireSchoolPermission("users.update");
    const req = {
        user: { role: "TEACHER" },
    } as unknown as Request;
    const { res, state } = createMockResponse();

    let called = false;
    const next: NextFunction = () => {
        called = true;
    };

    middleware(req, res, next);
    assert.equal(called, false);
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.payload, { error: "Forbidden" });
});
