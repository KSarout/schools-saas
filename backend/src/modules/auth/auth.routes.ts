import {Router} from "express";
import {z} from "zod";

import {UserModel} from "../users/user.model";
import {TenantModel} from "../tenants/tenant.model";

import {verifyPassword, hashPassword} from "../../utils/password";
import {signSchoolAccessToken} from "../../utils/jwt";

import {schoolAuth} from "../../middlewares/schoolAuth";

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

/*
|--------------------------------------------------------------------------
| LOGIN (School User)
|--------------------------------------------------------------------------
| Requires: X-Tenant header
*/
authRouter.post("/login", async (req, res) => {
    const body = loginBodySchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({error: "Invalid input"});

    const rawTenant = req.header("X-Tenant");
    const tenantParsed = tenantHeaderSchema.safeParse(rawTenant?.trim().toLowerCase());

    // Enterprise: prevent tenant enumeration
    const fail = () => res.status(401).json({error: "Invalid credentials"});

    if (!tenantParsed.success) return fail();
    const tenantSlug = tenantParsed.data;

    const tenant = await TenantModel.findOne({slug: tenantSlug, isActive: true}).lean();
    if (!tenant) return fail();

    const user = await UserModel.findOne({
        tenantId: tenant._id,
        email: body.data.email.toLowerCase(),
        isActive: true,
    });

    if (!user) return fail();

    const ok = await verifyPassword(body.data.password, user.passwordHash);
    if (!ok) return fail();

    const accessToken = signSchoolAccessToken({
        userId: user._id.toString(),
        tenantId: tenant._id.toString(),
        role: user.role,
    });

    return res.json({
        accessToken,
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

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/
authRouter.get("/me", schoolAuth, async (req, res) => {
    const {userId, tenantId} = req.user!;

    const user = await UserModel.findOne({
        _id: userId,
        tenantId,
        isActive: true,
    }).lean();

    if (!user) return res.status(404).json({error: "User not found"});

    const tenant = await TenantModel.findById(tenantId).lean();
    if (!tenant) return res.status(404).json({error: "Tenant not found"});

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
authRouter.post("/change-password", schoolAuth, async (req, res) => {
    const body = changePasswordBodySchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({error: "Invalid input"});

    const {userId, tenantId} = req.user!;

    const user = await UserModel.findOne({_id: userId, tenantId});
    if (!user) return res.status(404).json({error: "User not found"});

    const ok = await verifyPassword(body.data.currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({error: "Current password incorrect"});

    user.passwordHash = await hashPassword(body.data.newPassword);
    user.mustChangePassword = false;
    await user.save();

    return res.json({ok: true});
});
