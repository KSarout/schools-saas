import test from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

import { signSchoolAccessToken } from "../../../utils/jwt";
import { schoolAuth } from "../../../middlewares/schoolAuth";
import { requireRole } from "../../../middlewares/rbac";
import {
    assignEnrollmentHandler,
    getStudentEnrollmentHistoryHandler,
    listEnrollmentAuditLogsHandler,
    listEnrollmentsHandler,
    promoteEnrollmentHandler,
    transferEnrollmentHandler,
    withdrawEnrollmentHandler,
} from "../enrollment.routes";
import * as enrollmentService from "../service/enrollment.service";

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

function runRole(roles: Array<"SCHOOL_ADMIN" | "ACCOUNTANT" | "TEACHER">, req: Request, res: Response) {
    const middleware = requireRole(...roles);
    let called = false;
    const next: NextFunction = () => {
        called = true;
    };
    middleware(req, res, next);
    return called;
}

test("tenant isolation: listEnrollmentsHandler passes caller tenantId", async () => {
    const originalListEnrollments = enrollmentService.listEnrollments;
    let seenTenantId = "";

    (enrollmentService as any).listEnrollments = async (tenantId: Types.ObjectId) => {
        seenTenantId = tenantId.toString();
        return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
    };

    try {
        const req = createRequest({
            method: "GET",
            role: "TEACHER",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a99",
            query: { page: "1", limit: "10" },
        });
        const { res } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runRole(["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"], req, res), true);
        await listEnrollmentsHandler(req, res);

        assert.equal(seenTenantId, TENANT_A);
    } finally {
        (enrollmentService as any).listEnrollments = originalListEnrollments;
    }
});

test("tenant isolation: listEnrollmentAuditLogsHandler passes caller tenantId", async () => {
    const originalListAudit = enrollmentService.listEnrollmentAuditLogs;
    let seenTenantId = "";

    (enrollmentService as any).listEnrollmentAuditLogs = async (tenantId: Types.ObjectId) => {
        seenTenantId = tenantId.toString();
        return { items: [], total: 0, page: 1, limit: 20, totalPages: 1 };
    };

    try {
        const req = createRequest({
            method: "GET",
            role: "ACCOUNTANT",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a98",
            query: { page: "1", limit: "20" },
        });
        const { res } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runRole(["SCHOOL_ADMIN", "ACCOUNTANT"], req, res), true);
        await listEnrollmentAuditLogsHandler(req, res);

        assert.equal(seenTenantId, TENANT_A);
    } finally {
        (enrollmentService as any).listEnrollmentAuditLogs = originalListAudit;
    }
});

test("tenant isolation: tenant A cannot assign cross-tenant refs", async () => {
    const originalAssign = enrollmentService.assignStudentEnrollment;

    (enrollmentService as any).assignStudentEnrollment = async () => {
        const err = new Error("Student not found");
        (err as any).status = 404;
        throw err;
    };

    try {
        const req = createRequest({
            method: "POST",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a01",
            body: {
                studentId: "67f1f77bcf86cd7994390a33",
                academicYearId: "67f1f77bcf86cd7994390a34",
                classId: "67f1f77bcf86cd7994390a35",
                sectionId: "67f1f77bcf86cd7994390a36",
                startDate: "2026-01-01",
            },
        });
        const { res, state } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runRole(["SCHOOL_ADMIN"], req, res), true);
        await assignEnrollmentHandler(req, res);

        assert.equal(state.statusCode, 404);
        assert.deepEqual(state.payload, { error: "Student not found" });
    } finally {
        (enrollmentService as any).assignStudentEnrollment = originalAssign;
    }
});

test("RBAC: teacher can read list and history", async () => {
    const originalListEnrollments = enrollmentService.listEnrollments;
    const originalHistory = enrollmentService.getStudentEnrollmentHistory;
    (enrollmentService as any).listEnrollments = async () => ({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
    });
    (enrollmentService as any).getStudentEnrollmentHistory = async () => [];

    try {
        const listReq = createRequest({
            method: "GET",
            role: "TEACHER",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a55",
            query: { page: "1", limit: "10" },
        });
        const { res: listRes } = createMockResponse();
        assert.equal(runAuth(listReq, listRes), true);
        assert.equal(runRole(["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"], listReq, listRes), true);

        const historyReq = createRequest({
            method: "GET",
            role: "TEACHER",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a56",
            routeParams: { studentId: "67f1f77bcf86cd7994390a57" },
        });
        const { res: historyRes } = createMockResponse();
        assert.equal(runAuth(historyReq, historyRes), true);
        assert.equal(runRole(["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"], historyReq, historyRes), true);
    } finally {
        (enrollmentService as any).listEnrollments = originalListEnrollments;
        (enrollmentService as any).getStudentEnrollmentHistory = originalHistory;
    }
});

test("RBAC: accountant can read enrollment audit logs", async () => {
    const req = createRequest({
        method: "GET",
        role: "ACCOUNTANT",
        tenantId: TENANT_A,
        userId: "67f1f77bcf86cd7994390a58",
        query: { page: "1", limit: "20" },
    });
    const { res } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runRole(["SCHOOL_ADMIN", "ACCOUNTANT"], req, res), true);
});

test("RBAC: teacher cannot mutate enrollments", () => {
    const req = createRequest({
        method: "POST",
        role: "TEACHER",
        tenantId: TENANT_A,
        userId: "67f1f77bcf86cd7994390a60",
    });
    const { res, state } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runRole(["SCHOOL_ADMIN"], req, res), false);
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.payload, { error: "Forbidden" });
});

test("RBAC: teacher cannot read enrollment audit logs", () => {
    const req = createRequest({
        method: "GET",
        role: "TEACHER",
        tenantId: TENANT_A,
        userId: "67f1f77bcf86cd7994390a61",
        query: { page: "1", limit: "20" },
    });
    const { res, state } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runRole(["SCHOOL_ADMIN", "ACCOUNTANT"], req, res), false);
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.payload, { error: "Forbidden" });
});

test("history handler validates ObjectId and returns 400", async () => {
    const req = createRequest({
        method: "GET",
        role: "SCHOOL_ADMIN",
        tenantId: TENANT_A,
        userId: "67f1f77bcf86cd7994390a71",
        routeParams: { studentId: "not-object-id" },
    });
    const { res, state } = createMockResponse();

    assert.equal(runAuth(req, res), true);
    assert.equal(runRole(["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"], req, res), true);
    await getStudentEnrollmentHistoryHandler(req, res);

    assert.equal(state.statusCode, 400);
    assert.deepEqual(state.payload, { error: "Invalid studentId" });
});

test("transfer handler returns 409 for duplicate active conflict", async () => {
    const originalTransfer = enrollmentService.transferStudentEnrollment;
    (enrollmentService as any).transferStudentEnrollment = async () => {
        const err = new Error("Active enrollment already exists for this student in this academic year");
        (err as any).status = 409;
        throw err;
    };

    try {
        const req = createRequest({
            method: "POST",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a72",
            body: {
                studentId: "67f1f77bcf86cd7994390a73",
                academicYearId: "67f1f77bcf86cd7994390a74",
                toClassId: "67f1f77bcf86cd7994390a75",
                toSectionId: "67f1f77bcf86cd7994390a76",
                effectiveDate: "2026-02-01",
            },
        });
        const { res, state } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runRole(["SCHOOL_ADMIN"], req, res), true);
        await transferEnrollmentHandler(req, res);

        assert.equal(state.statusCode, 409);
        assert.deepEqual(state.payload, {
            error: "Active enrollment already exists for this student in this academic year",
        });
    } finally {
        (enrollmentService as any).transferStudentEnrollment = originalTransfer;
    }
});

test("promote handler returns 400 for invalid input rule", async () => {
    const originalPromote = enrollmentService.promoteStudentEnrollment;
    (enrollmentService as any).promoteStudentEnrollment = async () => {
        const err = new Error("toAcademicYearId must be different from fromAcademicYearId");
        (err as any).status = 400;
        throw err;
    };

    try {
        const req = createRequest({
            method: "POST",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a80",
            body: {
                studentId: "67f1f77bcf86cd7994390a81",
                fromAcademicYearId: "67f1f77bcf86cd7994390a82",
                toAcademicYearId: "67f1f77bcf86cd7994390a82",
                toClassId: "67f1f77bcf86cd7994390a83",
                toSectionId: "67f1f77bcf86cd7994390a84",
                effectiveDate: "2026-02-01",
            },
        });
        const { res, state } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runRole(["SCHOOL_ADMIN"], req, res), true);
        await promoteEnrollmentHandler(req, res);

        assert.equal(state.statusCode, 400);
        assert.deepEqual(state.payload, {
            error: "toAcademicYearId must be different from fromAcademicYearId",
        });
    } finally {
        (enrollmentService as any).promoteStudentEnrollment = originalPromote;
    }
});

test("withdraw handler returns 404 when active enrollment is missing", async () => {
    const originalWithdraw = enrollmentService.withdrawStudentEnrollment;
    (enrollmentService as any).withdrawStudentEnrollment = async () => {
        const err = new Error("Active enrollment not found");
        (err as any).status = 404;
        throw err;
    };

    try {
        const req = createRequest({
            method: "POST",
            role: "SCHOOL_ADMIN",
            tenantId: TENANT_A,
            userId: "67f1f77bcf86cd7994390a85",
            body: {
                studentId: "67f1f77bcf86cd7994390a86",
                academicYearId: "67f1f77bcf86cd7994390a87",
                effectiveDate: "2026-02-01",
            },
        });
        const { res, state } = createMockResponse();

        assert.equal(runAuth(req, res), true);
        assert.equal(runRole(["SCHOOL_ADMIN"], req, res), true);
        await withdrawEnrollmentHandler(req, res);

        assert.equal(state.statusCode, 404);
        assert.deepEqual(state.payload, { error: "Active enrollment not found" });
    } finally {
        (enrollmentService as any).withdrawStudentEnrollment = originalWithdraw;
    }
});
