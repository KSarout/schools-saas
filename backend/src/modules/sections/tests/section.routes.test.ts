import test from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";

import { signSchoolAccessToken } from "../../../utils/jwt";
import { schoolAuth } from "../../../middlewares/schoolAuth";
import { requireSchoolPermission } from "../../../middlewares/rbac";
import { listSectionsHandler } from "../section.routes";
import * as service from "../section.service";

const TENANT_A = "67f1f77bcf86cd7994390a11";

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
        params: {},
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

test("tenant isolation: listSectionsHandler passes caller tenantId", async () => {
    const originalList = service.listSections;
    let seenTenantId = "";

    (service as any).listSections = async (tenantId: any) => {
        seenTenantId = String(tenantId);
        return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
    };

    try {
        const req = createRequest({
            method: "GET",
            role: "TEACHER",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390aaa",
            query: { page: "1", limit: "10" },
        });
        const { res } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runPermission("sections.list", req, res), true);
        await listSectionsHandler(req, res);

        assert.equal(seenTenantId, TENANT_A);
    } finally {
        (service as any).listSections = originalList;
    }
});

test("RBAC: teacher cannot create sections", () => {
    const req = createRequest({
        method: "POST",
        role: "TEACHER",
        tenantId: TENANT_A,
        userId: "67f1f77bcf86cd7994390ab4",
        body: {
            name: "A",
            code: "A",
            classId: "67f1f77bcf86cd7994390ab5",
        },
    });
    const { res, state } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runPermission("sections.create", req, res), false);
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.payload, { error: "Forbidden" });
});
