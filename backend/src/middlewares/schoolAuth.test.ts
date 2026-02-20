import test from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";

import { schoolAuth } from "./schoolAuth";
import { signSchoolAccessToken, signSchoolRefreshToken } from "../utils/jwt";

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

test("schoolAuth accepts valid access token", () => {
    const token = signSchoolAccessToken({
        userId: "67f1f77bcf86cd7994390111",
        tenantId: "67f1f77bcf86cd7994390222",
        role: "SCHOOL_ADMIN",
    });

    const req = {
        header(name: string) {
            return name === "Authorization" ? `Bearer ${token}` : undefined;
        },
    } as unknown as Request;

    const { res, state } = createMockResponse();
    let called = false;
    const next: NextFunction = () => {
        called = true;
    };

    schoolAuth(req, res, next);

    assert.equal(called, true);
    assert.equal(state.statusCode, undefined);
    assert.equal(req.user?.role, "SCHOOL_ADMIN");
});

test("schoolAuth rejects refresh token on protected access routes", () => {
    const token = signSchoolRefreshToken({
        userId: "67f1f77bcf86cd7994390333",
        tenantId: "67f1f77bcf86cd7994390444",
        role: "TEACHER",
        tokenId: "refresh-token-id",
    });

    const req = {
        header(name: string) {
            return name === "Authorization" ? `Bearer ${token}` : undefined;
        },
    } as unknown as Request;

    const { res, state } = createMockResponse();
    let called = false;
    const next: NextFunction = () => {
        called = true;
    };

    schoolAuth(req, res, next);

    assert.equal(called, false);
    assert.equal(state.statusCode, 401);
    assert.deepEqual(state.payload, { error: "Invalid token" });
});
