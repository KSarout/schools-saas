import { Router } from "express";
import { z } from "zod";

import { User } from "../users/user.model";
import { Tenant } from "../tenants/tenant.model";

import { verifyPassword, hashPassword } from "../../utils/password";
import { signSchoolAccessToken } from "../../utils/jwt";

import { schoolAuth } from "../../middlewares/schoolAuth";

export const authRouter = Router();

/*
|--------------------------------------------------------------------------
| LOGIN (School User)
|--------------------------------------------------------------------------
| Requires: X-Tenant header
*/
authRouter.post("/login", async (req, res) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "Invalid input" });

    const tenantSlug = req.header("X-Tenant");
    if (!tenantSlug)
        return res.status(400).json({ error: "Missing X-Tenant header" });

    const tenant = await Tenant.findOne({
        slug: tenantSlug,
        isActive: true,
    });

    if (!tenant)
        return res.status(404).json({ error: "Tenant not found" });

    const user = await User.findOne({
        tenantId: tenant._id,
        email: parsed.data.email.toLowerCase(),
        isActive: true,
    });

    if (!user)
        return res.status(401).json({ error: "Invalid credentials" });

    const ok = await verifyPassword(
        parsed.data.password,
        user.passwordHash
    );

    if (!ok)
        return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = signSchoolAccessToken({
        userId: user._id.toString(),
        tenantId: tenant._id.toString(),
        role: user.role,
    });

    return res.json({
        accessToken,
        mustChangePassword: user.mustChangePassword,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        tenant: {
            id: tenant._id,
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
    const { userId, tenantId } = req.user!;

    const user = await User.findOne({
        _id: userId,
        tenantId,
        isActive: true,
    });

    if (!user)
        return res.status(404).json({ error: "User not found" });

    const tenant = await Tenant.findById(tenantId);
    if (!tenant)
        return res.status(404).json({ error: "Tenant not found" });

    return res.json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
        },
        tenant: {
            id: tenant._id,
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
authRouter.post(
    "/change-password",
    schoolAuth,
    async (req, res) => {
        const schema = z.object({
            currentPassword: z.string().min(6),
            newPassword: z.string().min(8),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: "Invalid input" });

        const { userId, tenantId } = req.user!;

        const user = await User.findOne({
            _id: userId,
            tenantId,
        });

        if (!user)
            return res.status(404).json({ error: "User not found" });

        const ok = await verifyPassword(
            parsed.data.currentPassword,
            user.passwordHash
        );

        if (!ok)
            return res
                .status(401)
                .json({ error: "Current password incorrect" });

        user.passwordHash = await hashPassword(
            parsed.data.newPassword
        );

        user.mustChangePassword = false;
        await user.save();

        return res.json({ ok: true });
    }
);
