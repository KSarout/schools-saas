import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

type JwtExpiresIn = `${number}${"s" | "m" | "h" | "d"}` | number;

const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    PORT: z.string().regex(/^\d+$/).optional(),
    MONGO_URI: z.string().min(1),
    CORS_ALLOWED_ORIGINS: z.string().optional(),
    CORS_ALLOW_CREDENTIALS: z.enum(["true", "false"]).optional(),
    TRUST_PROXY: z.enum(["true", "false"]).optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
    RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).optional(),
    RATE_LIMIT_MAX: z.string().regex(/^\d+$/).optional(),
    AUTH_RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).optional(),
    AUTH_RATE_LIMIT_MAX: z.string().regex(/^\d+$/).optional(),
    REFRESH_RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).optional(),
    REFRESH_RATE_LIMIT_MAX: z.string().regex(/^\d+$/).optional(),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_ISSUER: z.string().min(1).optional(),
    JWT_SCHOOL_AUDIENCE: z.string().min(1).optional(),
    JWT_SUPER_ADMIN_AUDIENCE: z.string().min(1).optional(),
    ACCESS_TOKEN_EXPIRES: z.string().regex(/^\d+([smhd])?$/).optional(),
    REFRESH_TOKEN_EXPIRES: z.string().regex(/^\d+([smhd])?$/).optional(),
    STUDENTS_REQUIRE_STRUCTURE_ON_CREATE: z.enum(["true", "false"]).optional(),
});

function parseJwtExpires(value: string | undefined, fallback: JwtExpiresIn): JwtExpiresIn {
    if (!value) return fallback;
    if (/^\d+$/.test(value)) return Number(value);
    return value as JwtExpiresIn;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
    if (!value) return fallback;
    return value === "true";
}

function parseInteger(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    return Number(value);
}

function parseOrigins(raw: string | undefined): string[] {
    if (!raw) return ["http://localhost:3000"];
    return raw.split(",").map((v) => v.trim()).filter(Boolean);
}

const env = EnvSchema.parse(process.env);

export const config = {
    nodeEnv: env.NODE_ENV ?? "development",
    port: env.PORT ?? "4000",
    mongoUri: env.MONGO_URI,
    trustProxy: parseBoolean(env.TRUST_PROXY, false),
    logLevel: env.LOG_LEVEL ?? "info",
    corsAllowedOrigins: parseOrigins(env.CORS_ALLOWED_ORIGINS),
    corsAllowCredentials: parseBoolean(env.CORS_ALLOW_CREDENTIALS, true),
    rateLimitWindowMs: parseInteger(env.RATE_LIMIT_WINDOW_MS, 60_000),
    rateLimitMax: parseInteger(env.RATE_LIMIT_MAX, 200),
    authRateLimitWindowMs: parseInteger(env.AUTH_RATE_LIMIT_WINDOW_MS, 10 * 60_000),
    authRateLimitMax: parseInteger(env.AUTH_RATE_LIMIT_MAX, 10),
    refreshRateLimitWindowMs: parseInteger(env.REFRESH_RATE_LIMIT_WINDOW_MS, 10 * 60_000),
    refreshRateLimitMax: parseInteger(env.REFRESH_RATE_LIMIT_MAX, 30),

    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtIssuer: env.JWT_ISSUER ?? "school-saas-api",
    jwtSchoolAudience: env.JWT_SCHOOL_AUDIENCE ?? "school-client",
    jwtSuperAdminAudience: env.JWT_SUPER_ADMIN_AUDIENCE ?? "super-admin-client",

    accessTokenExpires: parseJwtExpires(env.ACCESS_TOKEN_EXPIRES, "15m"),

    refreshTokenExpires: parseJwtExpires(env.REFRESH_TOKEN_EXPIRES, "7d"),
    studentsRequireStructureOnCreate: parseBoolean(env.STUDENTS_REQUIRE_STRUCTURE_ON_CREATE, false),
};
