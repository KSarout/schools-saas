import {Router} from "express";
import {z} from "zod";

import {SuperAdminModel} from "./superAdmin.model";
import {TenantModel} from "../tenants/tenant.model";
import {UserModel} from "../users/user.model";

import {verifyPassword, hashPassword} from "../../utils/password";
import {signSuperAdminAccessToken} from "../../utils/jwt";

import {superAdminAuth} from "../../middlewares/superAdminAuth";

export const superAdminRouter = Router();

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
superAdminRouter.post("/login", async (req, res) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({error: "Invalid input"});

    const admin = await SuperAdminModel.findOne({
        email: parsed.data.email.toLowerCase(),
    });

    if (!admin)
        return res.status(401).json({error: "Invalid credentials"});

    const ok = await verifyPassword(parsed.data.password, admin.passwordHash);

    if (!ok)
        return res.status(401).json({error: "Invalid credentials"});

    const accessToken = signSuperAdminAccessToken({
        superAdminId: admin._id.toString(),
        role: "SUPER_ADMIN",
    });

    return res.json({
        accessToken,
        superAdmin: {
            id: admin._id,
            email: admin.email,
        },
    });
});

/*
|--------------------------------------------------------------------------
| ME
|--------------------------------------------------------------------------
*/
superAdminRouter.get("/me", superAdminAuth, async (req, res) => {
    const admin = await SuperAdminModel.findById(req.superAdmin!.superAdminId);

    if (!admin)
        return res.status(404).json({error: "Super admin not found"});

    return res.json({
        superAdmin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
        },
    });
});

/*
|--------------------------------------------------------------------------
| CREATE TENANT + CREATE SCHOOL ADMIN
|--------------------------------------------------------------------------
*/
superAdminRouter.post("/tenants", superAdminAuth, async (req, res) => {
    const schema = z.object({
        tenantName: z.string().min(2),
        tenantSlug: z.string().min(2).regex(/^[a-z0-9-]+$/),
        adminName: z.string().min(2),
        adminEmail: z.string().email(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({error: "Invalid input"});

    const {tenantName, tenantSlug, adminName, adminEmail} = parsed.data;

    const existingTenant = await TenantModel.findOne({slug: tenantSlug.toLowerCase()});

    if (existingTenant)
        return res.status(400).json({error: "Tenant slug already exists"});

    const tenant = await TenantModel.create({
        name: tenantName,
        slug: tenantSlug.toLowerCase(),
    });

    const tempPassword = Math.random().toString(36).slice(-8);

    const passwordHash = await hashPassword(tempPassword);

    const schoolAdmin = await UserModel.create({
        tenantId: tenant._id,
        name: adminName,
        email: adminEmail.toLowerCase(),
        role: "SCHOOL_ADMIN",
        passwordHash,
        mustChangePassword: true,
        isActive: true,
    });

    return res.json({
        tenant: {
            id: tenant._id,
            name: tenant.name,
            slug: tenant.slug,
        },
        schoolAdmin: {
            id: schoolAdmin._id,
            email: schoolAdmin.email,
            tempPassword,
        },
    });
});

/*
|--------------------------------------------------------------------------
| LIST TENANTS (Search + Pagination)
|--------------------------------------------------------------------------
| GET /super-admin/tenants?q=&page=&limit=
*/
superAdminRouter.get("/tenants", superAdminAuth, async (req, res) => {
    const schema = z.object({
        q: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
    });

    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({error: "Invalid query params"});

    const q = (parsed.data.q ?? "").trim();
    const page = Math.max(1, Number(parsed.data.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(parsed.data.limit ?? 10)));

    const filter: Record<string, any> = {};
    if (q) {
        filter.$or = [
            {name: {$regex: q, $options: "i"}},
            {slug: {$regex: q, $options: "i"}},
        ];
    }

    const [items, total] = await Promise.all([
        TenantModel.find(filter)
            .sort({createdAt: -1})
            .skip((page - 1) * limit)
            .limit(limit),
        TenantModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.json({
        items: items.map((t) => ({
            id: t._id.toString(),
            name: t.name,
            slug: t.slug,
            isActive: t.isActive,
            createdAt: t.createdAt?.toISOString?.() ?? undefined,
        })),
        total,
        page,
        limit,
        totalPages,
    });
});


/*
|--------------------------------------------------------------------------
| RESET SCHOOL ADMIN PASSWORD
|--------------------------------------------------------------------------
*/
superAdminRouter.post(
    "/tenants/:tenantId/reset-password",
    superAdminAuth,
    async (req, res) => {
        const tenant = await TenantModel.findById(req.params.tenantId);

        if (!tenant)
            return res.status(404).json({error: "Tenant not found"});

        const admin = await UserModel.findOne({
            tenantId: tenant._id,
            role: "SCHOOL_ADMIN",
        });

        if (!admin)
            return res.status(404).json({error: "School admin not found"});

        const tempPassword = Math.random().toString(36).slice(-8);

        admin.passwordHash = await hashPassword(tempPassword);
        admin.mustChangePassword = true;

        await admin.save();

        return res.json({
            adminEmail: admin.email,
            tempPassword,
        });
    }
);
