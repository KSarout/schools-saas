import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { config } from "../core/config";
import {
    SchoolJwtPayload,
    SuperAdminJwtPayload,
} from "../types/jwt";

const accessSecret: Secret = config.jwtAccessSecret;

const accessOptions: SignOptions = {
    expiresIn: config.accessTokenExpires,
};

export function signSchoolAccessToken(
    payload: SchoolJwtPayload
): string {
    return jwt.sign(payload, accessSecret, accessOptions);
}

export function signSuperAdminAccessToken(
    payload: SuperAdminJwtPayload
): string {
    return jwt.sign(payload, accessSecret, accessOptions);
}

export function verifySchoolAccessToken(
    token: string
): SchoolJwtPayload {
    return jwt.verify(
        token,
        accessSecret
    ) as SchoolJwtPayload;
}

export function verifySuperAdminAccessToken(
    token: string
): SuperAdminJwtPayload {
    return jwt.verify(
        token,
        accessSecret
    ) as SuperAdminJwtPayload;
}
