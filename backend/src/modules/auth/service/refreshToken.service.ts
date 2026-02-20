import { randomUUID } from "node:crypto";
import {
    signSchoolAccessToken,
    signSchoolRefreshToken,
    signSuperAdminAccessToken,
    signSuperAdminRefreshToken,
    verifySchoolRefreshToken,
    verifySuperAdminRefreshToken,
} from "../../../utils/jwt";
import { RefreshTokenModel, type RefreshTokenSubjectType } from "../model/refreshToken.model";
import type { SchoolRole } from "../../../types/jwt";

type IssueSchoolTokensInput = {
    userId: string;
    tenantId: string;
    role: SchoolRole;
};

type IssueSuperAdminTokensInput = {
    superAdminId: string;
    role: "SUPER_ADMIN";
};

function decodeTokenExpMs(token: string): number {
    const payload = token.split(".")[1];
    if (!payload) throw new Error("Invalid token format");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded?.exp || typeof decoded.exp !== "number") throw new Error("Invalid token exp");
    return decoded.exp * 1000;
}

async function persistRefreshToken(input: {
    tokenId: string;
    subjectType: RefreshTokenSubjectType;
    subjectId: string;
    tenantId?: string;
    role: string;
    expiresAt: Date;
}) {
    await RefreshTokenModel.create(input);
}

export async function issueSchoolTokenPair(input: IssueSchoolTokensInput) {
    const tokenId = randomUUID();

    const accessToken = signSchoolAccessToken({
        userId: input.userId,
        tenantId: input.tenantId,
        role: input.role,
    });

    const refreshToken = signSchoolRefreshToken({
        userId: input.userId,
        tenantId: input.tenantId,
        role: input.role,
        tokenId,
    });

    await persistRefreshToken({
        tokenId,
        subjectType: "SCHOOL_USER",
        subjectId: input.userId,
        tenantId: input.tenantId,
        role: input.role,
        expiresAt: new Date(decodeTokenExpMs(refreshToken)),
    });

    return { accessToken, refreshToken };
}

export async function issueSuperAdminTokenPair(input: IssueSuperAdminTokensInput) {
    const tokenId = randomUUID();

    const accessToken = signSuperAdminAccessToken({
        superAdminId: input.superAdminId,
        role: input.role,
    });

    const refreshToken = signSuperAdminRefreshToken({
        superAdminId: input.superAdminId,
        role: input.role,
        tokenId,
    });

    await persistRefreshToken({
        tokenId,
        subjectType: "SUPER_ADMIN",
        subjectId: input.superAdminId,
        role: input.role,
        expiresAt: new Date(decodeTokenExpMs(refreshToken)),
    });

    return { accessToken, refreshToken };
}

async function loadActiveRefreshToken(tokenId: string, subjectType: RefreshTokenSubjectType) {
    const now = new Date();
    const token = await RefreshTokenModel.findOne({
        tokenId,
        subjectType,
        revokedAt: { $exists: false },
        expiresAt: { $gt: now },
    });

    return token;
}

async function rotateRefreshTokenRecord(currentTokenId: string, replacementTokenId: string) {
    await RefreshTokenModel.updateOne(
        { tokenId: currentTokenId, revokedAt: { $exists: false } },
        {
            $set: {
                revokedAt: new Date(),
                replacedByTokenId: replacementTokenId,
            },
        }
    );
}

export async function rotateSchoolTokenPair(refreshToken: string) {
    const decoded = verifySchoolRefreshToken(refreshToken);
    const active = await loadActiveRefreshToken(decoded.tokenId, "SCHOOL_USER");
    if (!active) throw new Error("Invalid refresh token");

    const nextTokenId = randomUUID();
    await rotateRefreshTokenRecord(decoded.tokenId, nextTokenId);

    const nextAccessToken = signSchoolAccessToken({
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        role: decoded.role,
    });

    const nextRefreshToken = signSchoolRefreshToken({
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        role: decoded.role,
        tokenId: nextTokenId,
    });

    await persistRefreshToken({
        tokenId: nextTokenId,
        subjectType: "SCHOOL_USER",
        subjectId: decoded.userId,
        tenantId: decoded.tenantId,
        role: decoded.role,
        expiresAt: new Date(decodeTokenExpMs(nextRefreshToken)),
    });

    return {
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
    };
}

export async function rotateSuperAdminTokenPair(refreshToken: string) {
    const decoded = verifySuperAdminRefreshToken(refreshToken);
    const active = await loadActiveRefreshToken(decoded.tokenId, "SUPER_ADMIN");
    if (!active) throw new Error("Invalid refresh token");

    const nextTokenId = randomUUID();
    await rotateRefreshTokenRecord(decoded.tokenId, nextTokenId);

    const nextAccessToken = signSuperAdminAccessToken({
        superAdminId: decoded.superAdminId,
        role: decoded.role,
    });

    const nextRefreshToken = signSuperAdminRefreshToken({
        superAdminId: decoded.superAdminId,
        role: decoded.role,
        tokenId: nextTokenId,
    });

    await persistRefreshToken({
        tokenId: nextTokenId,
        subjectType: "SUPER_ADMIN",
        subjectId: decoded.superAdminId,
        role: decoded.role,
        expiresAt: new Date(decodeTokenExpMs(nextRefreshToken)),
    });

    return {
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
    };
}

export async function revokeSchoolRefreshToken(refreshToken: string) {
    const decoded = verifySchoolRefreshToken(refreshToken);
    await RefreshTokenModel.updateOne(
        { tokenId: decoded.tokenId, subjectType: "SCHOOL_USER", revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
    );
}

export async function revokeSuperAdminRefreshToken(refreshToken: string) {
    const decoded = verifySuperAdminRefreshToken(refreshToken);
    await RefreshTokenModel.updateOne(
        { tokenId: decoded.tokenId, subjectType: "SUPER_ADMIN", revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
    );
}

export async function revokeAllSchoolRefreshTokensForUser(userId: string, tenantId: string) {
    await RefreshTokenModel.updateMany(
        { subjectType: "SCHOOL_USER", subjectId: userId, tenantId, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
    );
}
