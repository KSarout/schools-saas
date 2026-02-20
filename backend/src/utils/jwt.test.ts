import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { config } from "../core/config";
import {
    signSchoolAccessToken,
    signSchoolRefreshToken,
    signSuperAdminAccessToken,
    verifySchoolAccessToken,
    verifySchoolRefreshToken,
    verifySuperAdminAccessToken,
} from "./jwt";

test("school access token validates issuer/audience/domain/type", () => {
    const token = signSchoolAccessToken({
        userId: "u1",
        tenantId: "t1",
        role: "SCHOOL_ADMIN",
    });

    const decoded = verifySchoolAccessToken(token);
    assert.equal(decoded.userId, "u1");
    assert.equal(decoded.tenantId, "t1");
    assert.equal(decoded.role, "SCHOOL_ADMIN");
});

test("school refresh token cannot be used as school access token", () => {
    const refresh = signSchoolRefreshToken({
        userId: "u2",
        tenantId: "t2",
        role: "TEACHER",
        tokenId: "tok-1",
    });

    assert.throws(() => verifySchoolAccessToken(refresh));
    const decoded = verifySchoolRefreshToken(refresh);
    assert.equal(decoded.tokenId, "tok-1");
});

test("super-admin access token cannot be used as school access token", () => {
    const token = signSuperAdminAccessToken({
        superAdminId: "sa-1",
        role: "SUPER_ADMIN",
    });

    assert.throws(() => verifySchoolAccessToken(token));
    const decoded = verifySuperAdminAccessToken(token);
    assert.equal(decoded.superAdminId, "sa-1");
});

test("issuer and audience are enforced", () => {
    const forged = jwt.sign(
        {
            userId: "u3",
            tenantId: "t3",
            role: "ACCOUNTANT",
            tokenType: "access",
            domain: "school",
        },
        config.jwtAccessSecret,
        {
            expiresIn: "15m",
            issuer: "different-issuer",
            audience: config.jwtSchoolAudience,
        }
    );

    assert.throws(() => verifySchoolAccessToken(forged));
});
