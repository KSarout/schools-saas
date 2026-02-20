import {Router} from "express";
import {z} from "zod";

import {TenantModel} from "../../tenants/model/tenant.model";
import {
    findActiveUserByEmail,
    findActiveUserById,
    findUserById,
} from "../../users/service/user.repo";

import {verifyPassword, hashPassword} from "../../../utils/password";
import {
    issueSchoolTokenPair,
    revokeAllSchoolRefreshTokensForUser,
    revokeSchoolRefreshToken,
    rotateSchoolTokenPair,
} from "../service/refreshToken.service";

import {schoolAuth} from "../../../middlewares/schoolAuth";
import {requireSchoolPermission} from "../../../middlewares/rbac";
import { sendError, sendOk } from "../../../core/apiResponse";

export const authRouter = Router();

/** ---------- Validators ---------- */
const tenantHeaderSchema = z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/);

const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const changePasswordBodySchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8),
});

const refreshBodySchema = z.object({
    refreshToken: z.string().min(20),
});

/*
|--------------------------------------------------------------------------
| LOGIN (School User)
|--------------------------------------------------------------------------
| Requires: X-Tenant header
*/
authRouter.post("/login", async (req, res) => {
    const body = loginBodySchema.safeParse(req.body);
    if (!body.success) return sendError(res, 400, "Invalid input", body.error.issues);

    const rawTenant = req.header("X-Tenant");
    const tenantParsed = tenantHeaderSchema.safeParse(rawTenant?.trim().toLowerCase());

    // Enterprise: prevent tenant enumeration
    const fail = () => sendError(res, 401, "Invalid credentials");

    if (!tenantParsed.success) return fail();
    const tenantSlug = tenantParsed.data;

    const tenant = await TenantModel.findOne({slug: tenantSlug, isActive: true}).lean();
    if (!tenant) return fail();

    const user = await findActiveUserByEmail(
        tenant._id,
        body.data.email.toLowerCase()
    );

    if (!user) return fail();

    const ok = await verifyPassword(body.data.password, user.passwordHash);
    if (!ok) return fail();

    const tokens = await issueSchoolTokenPair({
        userId: user._id.toString(),
        tenantId: tenant._id.toString(),
        role: user.role,
    });

    return res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        mustChangePassword: user.mustChangePassword,
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        },
        tenant: {
            id: tenant._id.toString(),
            name: tenant.name,
            slug: tenant.slug,
        },
    });
});

authRouter.post("/refresh", async (req, res) => {
    const parsed = refreshBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    try {
        const rotated = await rotateSchoolTokenPair(parsed.data.refreshToken);
        return res.json(rotated);
    } catch {
        return sendError(res, 401, "Invalid refresh token");
    }
});

authRouter.post("/logout", async (req, res) => {
    const parsed = refreshBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    try {
        await revokeSchoolRefreshToken(parsed.data.refreshToken);
    } catch {
        // Keep logout idempotent for clients
    }

    return sendOk(res);
});

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/
authRouter.get("/me", schoolAuth, requireSchoolPermission("auth.me"), async (req, res) => {
    const {userId, tenantId} = req.user!;

    const user = await findActiveUserById(tenantId, userId).lean();

    if (!user) return sendError(res, 404, "User not found");

    const tenant = await TenantModel.findById(tenantId).lean();
    if (!tenant) return sendError(res, 404, "Tenant not found");

    return res.json({
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
        },
        tenant: {
            id: tenant._id.toString(),
            name: tenant.name,
            slug: tenant.slug,
        },
    });
});

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/
authRouter.post("/change-password", schoolAuth, requireSchoolPermission("auth.changePassword"), async (req, res) => {
    const body = changePasswordBodySchema.safeParse(req.body);
    if (!body.success) return sendError(res, 400, "Invalid input", body.error.issues);

    const {userId, tenantId} = req.user!;

    const user = await findUserById(tenantId, userId);
    if (!user) return sendError(res, 404, "User not found");

    const ok = await verifyPassword(body.data.currentPassword, user.passwordHash);
    if (!ok) return sendError(res, 401, "Current password incorrect");

    user.passwordHash = await hashPassword(body.data.newPassword);
    user.mustChangePassword = false;
    await user.save();
    await revokeAllSchoolRefreshTokensForUser(user._id.toString(), tenantId.toString());

    return sendOk(res);
});
