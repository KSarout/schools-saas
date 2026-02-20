import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { config } from "../core/config";
import {
    SchoolAccessJwtPayload,
    SchoolJwtPayload,
    SchoolRefreshJwtPayload,
    SuperAdminAccessJwtPayload,
    SuperAdminJwtPayload,
    SuperAdminRefreshJwtPayload,
} from "../types/jwt";

const accessSecret: Secret = config.jwtAccessSecret;
const refreshSecret: Secret = config.jwtRefreshSecret;

function baseAccessOptions(audience: string): SignOptions {
    return {
        expiresIn: config.accessTokenExpires,
        issuer: config.jwtIssuer,
        audience,
    };
}

function baseRefreshOptions(audience: string): SignOptions {
    return {
        expiresIn: config.refreshTokenExpires,
        issuer: config.jwtIssuer,
        audience,
    };
}

export function signSchoolAccessToken(
    payload: SchoolJwtPayload
): string {
    return jwt.sign(
        {
            ...payload,
            tokenType: "access",
            domain: "school",
        },
        accessSecret,
        baseAccessOptions(config.jwtSchoolAudience)
    );
}

export function signSuperAdminAccessToken(
    payload: SuperAdminJwtPayload
): string {
    return jwt.sign(
        {
            ...payload,
            tokenType: "access",
            domain: "super_admin",
        },
        accessSecret,
        baseAccessOptions(config.jwtSuperAdminAudience)
    );
}

export function signSchoolRefreshToken(
    payload: Omit<SchoolRefreshJwtPayload, "tokenType" | "domain">
): string {
    return jwt.sign(
        {
            ...payload,
            tokenType: "refresh",
            domain: "school",
        },
        refreshSecret,
        baseRefreshOptions(config.jwtSchoolAudience)
    );
}

export function signSuperAdminRefreshToken(
    payload: Omit<SuperAdminRefreshJwtPayload, "tokenType" | "domain">
): string {
    return jwt.sign(
        {
            ...payload,
            tokenType: "refresh",
            domain: "super_admin",
        },
        refreshSecret,
        baseRefreshOptions(config.jwtSuperAdminAudience)
    );
}

function assertSchoolAccess(decoded: any): asserts decoded is SchoolAccessJwtPayload {
    if (decoded?.tokenType !== "access" || decoded?.domain !== "school") {
        throw new Error("Invalid school access token");
    }
}

function assertSuperAdminAccess(decoded: any): asserts decoded is SuperAdminAccessJwtPayload {
    if (decoded?.tokenType !== "access" || decoded?.domain !== "super_admin") {
        throw new Error("Invalid super admin access token");
    }
}

function assertSchoolRefresh(decoded: any): asserts decoded is SchoolRefreshJwtPayload {
    if (decoded?.tokenType !== "refresh" || decoded?.domain !== "school" || !decoded?.tokenId) {
        throw new Error("Invalid school refresh token");
    }
}

function assertSuperAdminRefresh(decoded: any): asserts decoded is SuperAdminRefreshJwtPayload {
    if (decoded?.tokenType !== "refresh" || decoded?.domain !== "super_admin" || !decoded?.tokenId) {
        throw new Error("Invalid super admin refresh token");
    }
}

export function verifySchoolAccessToken(
    token: string
): SchoolJwtPayload {
    const decoded = jwt.verify(
        token,
        accessSecret,
        {
            issuer: config.jwtIssuer,
            audience: config.jwtSchoolAudience,
        }
    ) as unknown;

    assertSchoolAccess(decoded);
    return decoded;
}

export function verifySuperAdminAccessToken(
    token: string
): SuperAdminJwtPayload {
    const decoded = jwt.verify(
        token,
        accessSecret,
        {
            issuer: config.jwtIssuer,
            audience: config.jwtSuperAdminAudience,
        }
    ) as unknown;

    assertSuperAdminAccess(decoded);
    return decoded;
}

export function verifySchoolRefreshToken(
    token: string
): SchoolRefreshJwtPayload {
    const decoded = jwt.verify(
        token,
        refreshSecret,
        {
            issuer: config.jwtIssuer,
            audience: config.jwtSchoolAudience,
        }
    ) as unknown;

    assertSchoolRefresh(decoded);
    return decoded;
}

export function verifySuperAdminRefreshToken(
    token: string
): SuperAdminRefreshJwtPayload {
    const decoded = jwt.verify(
        token,
        refreshSecret,
        {
            issuer: config.jwtIssuer,
            audience: config.jwtSuperAdminAudience,
        }
    ) as unknown;

    assertSuperAdminRefresh(decoded);
    return decoded;
}
