import test from "node:test";
import assert from "node:assert/strict";

import { RefreshTokenModel } from "../model/refreshToken.model";
import {
    issueSchoolTokenPair,
    revokeSchoolRefreshToken,
    rotateSchoolTokenPair,
} from "../service/refreshToken.service";

test("issueSchoolTokenPair stores refresh token session metadata", async () => {
    const originalCreate = RefreshTokenModel.create;
    let createdDoc: any;

    (RefreshTokenModel as any).create = async (doc: any) => {
        createdDoc = doc;
        return doc;
    };

    try {
        const tokens = await issueSchoolTokenPair({
            userId: "user-1",
            tenantId: "tenant-1",
            role: "SCHOOL_ADMIN",
        });

        assert.ok(tokens.accessToken.length > 20);
        assert.ok(tokens.refreshToken.length > 20);
        assert.equal(createdDoc.subjectType, "SCHOOL_USER");
        assert.equal(createdDoc.subjectId, "user-1");
        assert.equal(createdDoc.tenantId, "tenant-1");
        assert.ok(createdDoc.tokenId);
        assert.ok(createdDoc.expiresAt instanceof Date);
    } finally {
        (RefreshTokenModel as any).create = originalCreate;
    }
});

test("rotateSchoolTokenPair rejects revoked or missing refresh sessions", async () => {
    const originalFindOne = RefreshTokenModel.findOne;
    const originalCreate = RefreshTokenModel.create;

    (RefreshTokenModel as any).findOne = async () => null;
    (RefreshTokenModel as any).create = async (doc: any) => doc;

    try {
        const tokens = await issueSchoolTokenPair({
            userId: "user-2",
            tenantId: "tenant-2",
            role: "TEACHER",
        });

        await assert.rejects(() => rotateSchoolTokenPair(tokens.refreshToken));
    } finally {
        (RefreshTokenModel as any).findOne = originalFindOne;
        (RefreshTokenModel as any).create = originalCreate;
    }
});

test("revokeSchoolRefreshToken marks token as revoked", async () => {
    const originalUpdateOne = RefreshTokenModel.updateOne;
    const originalCreate = RefreshTokenModel.create;
    let updateFilter: any;
    let updateDoc: any;

    (RefreshTokenModel as any).updateOne = async (filter: any, doc: any) => {
        updateFilter = filter;
        updateDoc = doc;
        return { acknowledged: true };
    };
    (RefreshTokenModel as any).create = async (doc: any) => doc;

    try {
        const tokens = await issueSchoolTokenPair({
            userId: "user-3",
            tenantId: "tenant-3",
            role: "ACCOUNTANT",
        });

        await revokeSchoolRefreshToken(tokens.refreshToken);
        assert.equal(updateFilter.subjectType, "SCHOOL_USER");
        assert.ok(updateFilter.tokenId);
        assert.ok(updateDoc.$set?.revokedAt instanceof Date);
    } finally {
        (RefreshTokenModel as any).updateOne = originalUpdateOne;
        (RefreshTokenModel as any).create = originalCreate;
    }
});
