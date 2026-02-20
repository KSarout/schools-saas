import {Router} from "express";
import {z} from "zod";

import {SuperAdminModel} from "../model/superAdmin.model";
import {TenantModel} from "../../tenants/model/tenant.model";

import {verifyPassword, hashPassword} from "../../../utils/password";
import {
    issueSuperAdminTokenPair,
    revokeSuperAdminRefreshToken,
    rotateSuperAdminTokenPair,
} from "../../auth/service/refreshToken.service";

import {superAdminAuth} from "../../../middlewares/superAdminAuth";
import {requireSuperAdminPermission} from "../../../middlewares/rbac";
import { paginationQuerySchema } from "../../../core/listResponse";
import { createUserForTenant, findUserByRole } from "../../users/service/user.repo";
import { sendError, sendOk, sendList } from "../../../core/apiResponse";
import { buildTenantListFilter, tenantListSort } from "../../tenants/service/tenant.search";
import { escapeRegex } from "../../../core/regex";

export const superAdminRouter = Router();
const refreshBodySchema = z.object({
    refreshToken: z.string().min(20),
});

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
        return sendError(res, 400, "Invalid input", parsed.error.issues);

    const admin = await SuperAdminModel.findOne({
        email: parsed.data.email.toLowerCase(),
        isActive: true,
    });

    if (!admin)
        return sendError(res, 401, "Invalid credentials");

    const ok = await verifyPassword(parsed.data.password, admin.passwordHash);

    if (!ok)
        return sendError(res, 401, "Invalid credentials");

    const tokens = await issueSuperAdminTokenPair({
        superAdminId: admin._id.toString(),
        role: "SUPER_ADMIN",
    });

    return res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        superAdmin: {
            id: admin._id,
            email: admin.email,
        },
    });
});

superAdminRouter.post("/refresh", async (req, res) => {
    const parsed = refreshBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    try {
        const rotated = await rotateSuperAdminTokenPair(parsed.data.refreshToken);
        return res.json(rotated);
    } catch {
        return sendError(res, 401, "Invalid refresh token");
    }
});

superAdminRouter.post("/logout", async (req, res) => {
    const parsed = refreshBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    try {
        await revokeSuperAdminRefreshToken(parsed.data.refreshToken);
    } catch {
        // Keep logout idempotent for clients
    }

    return sendOk(res);
});

/*
|--------------------------------------------------------------------------
| ME
|--------------------------------------------------------------------------
*/
superAdminRouter.get("/me", superAdminAuth, requireSuperAdminPermission("superAdmin.me"), async (req, res) => {
    const admin = await SuperAdminModel.findById(req.superAdmin!.superAdminId);

    if (!admin)
        return sendError(res, 404, "Super admin not found");

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
superAdminRouter.post(
    "/tenants",
    superAdminAuth,
    requireSuperAdminPermission("superAdmin.tenants.create"),
    async (req, res) => {
        const schema = z.object({
            tenantName: z.string().min(2),
            tenantSlug: z.string().min(2).regex(/^[a-z0-9-]+$/),
            adminName: z.string().min(2),
            adminEmail: z.string().email(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
            return sendError(res, 400, "Invalid input", parsed.error.issues);

        const {tenantName, tenantSlug, adminName, adminEmail} = parsed.data;

        const existingTenant = await TenantModel.findOne({slug: tenantSlug.toLowerCase()});

        if (existingTenant)
            return sendError(res, 409, "Tenant slug already exists");

        const tenant = await TenantModel.create({
            name: tenantName,
            slug: tenantSlug.toLowerCase(),
        });

        const tempPassword = Math.random().toString(36).slice(-8);

        const passwordHash = await hashPassword(tempPassword);

        const schoolAdmin = await createUserForTenant(tenant._id, {
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
    }
);

type SuperAdminListLike = {
    _id: { toString(): string } | string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

function toSuperAdminUserDto(admin: SuperAdminListLike) {
    const id = typeof admin._id === "string" ? admin._id : admin._id.toString();
    return {
        id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        createdAt: admin.createdAt?.toISOString?.() ?? undefined,
        updatedAt: admin.updatedAt?.toISOString?.() ?? undefined,
    };
}

function generateTempPassword() {
    return Math.random().toString(36).slice(-10);
}

superAdminRouter.get(
    "/users",
    superAdminAuth,
    requireSuperAdminPermission("superAdmin.users.list"),
    async (req, res) => {
        const schema = paginationQuerySchema.extend({
            q: z.string().trim().optional().default(""),
            status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        });

        const parsed = schema.safeParse(req.query);
        if (!parsed.success) return sendError(res, 400, "Invalid query params", parsed.error.issues);

        const { q, status, page, limit } = parsed.data;
        const filter: Record<string, unknown> = {};

        if (status) {
            filter.isActive = status === "ACTIVE";
        }

        if (q) {
            const safePrefix = `^${escapeRegex(q.toLowerCase())}`;
            filter.$or = [
                { nameSearch: { $regex: safePrefix } },
                { emailSearch: { $regex: safePrefix } },
            ];
        }

        const [items, total] = await Promise.all([
            SuperAdminModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
            SuperAdminModel.countDocuments(filter),
        ]);

        return sendList(res, {
            items: items.map(toSuperAdminUserDto),
            total,
            page,
            limit,
        });
    }
);

superAdminRouter.post(
    "/users",
    superAdminAuth,
    requireSuperAdminPermission("superAdmin.users.create"),
    async (req, res) => {
        const schema = z.object({
            name: z.string().min(2),
            email: z.string().email(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

        const email = parsed.data.email.trim().toLowerCase();
        const exists = await SuperAdminModel.findOne({ email });
        if (exists) return sendError(res, 409, "Super admin email already exists");

        const tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);

        const created = await SuperAdminModel.create({
            name: parsed.data.name.trim(),
            email,
            passwordHash,
            isActive: true,
        });

        return res.status(201).json({
            user: toSuperAdminUserDto(created),
            tempPassword,
        });
    }
);

superAdminRouter.patch(
    "/users/:id",
    superAdminAuth,
    requireSuperAdminPermission("superAdmin.users.update"),
    async (req, res) => {
        const schema = z.object({
            name: z.string().min(2).optional(),
            isActive: z.boolean().optional(),
        }).refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

        const admin = await SuperAdminModel.findById(String(req.params.id));
        if (!admin) return sendError(res, 404, "Super admin user not found");

        if (parsed.data.name !== undefined) admin.name = parsed.data.name.trim();
        if (parsed.data.isActive !== undefined) admin.isActive = parsed.data.isActive;

        await admin.save();
        return res.json(toSuperAdminUserDto(admin));
    }
);

superAdminRouter.post(
    "/users/:id/reset-password",
    superAdminAuth,
    requireSuperAdminPermission("superAdmin.users.resetPassword"),
    async (req, res) => {
        const admin = await SuperAdminModel.findById(String(req.params.id));
        if (!admin) return sendError(res, 404, "Super admin user not found");

        const tempPassword = generateTempPassword();
        admin.passwordHash = await hashPassword(tempPassword);
        await admin.save();

        return res.json({
            userId: admin._id.toString(),
            email: admin.email,
            tempPassword,
        });
    }
);

/*
|--------------------------------------------------------------------------
| LIST TENANTS (Search + Pagination)
|--------------------------------------------------------------------------
| GET /super-admin/tenants?q=&page=&limit=
*/
superAdminRouter.get(
    "/tenants",
    superAdminAuth,
    requireSuperAdminPermission("superAdmin.tenants.list"),
    async (req, res) => {
        const schema = paginationQuerySchema.extend({
            q: z.string().trim().optional().default(""),
        });

        const parsed = schema.safeParse(req.query);
        if (!parsed.success) return sendError(res, 400, "Invalid query params", parsed.error.issues);

        const { q, page, limit } = parsed.data;

        const filter = buildTenantListFilter(q);

        const [items, total] = await Promise.all([
            TenantModel.find(filter)
                .sort(tenantListSort)
                .skip((page - 1) * limit)
                .limit(limit),
            TenantModel.countDocuments(filter),
        ]);

        return sendList(res, {
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
        });
    }
);


/*
|--------------------------------------------------------------------------
| RESET SCHOOL ADMIN PASSWORD
|--------------------------------------------------------------------------
*/
superAdminRouter.post(
    "/tenants/:tenantId/reset-password",
    superAdminAuth,
    requireSuperAdminPermission("superAdmin.tenants.resetPassword"),
    async (req, res) => {
        const tenant = await TenantModel.findById(req.params.tenantId);

        if (!tenant)
            return sendError(res, 404, "Tenant not found");

        const admin = await findUserByRole(tenant._id, "SCHOOL_ADMIN");

        if (!admin)
            return sendError(res, 404, "School admin not found");

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
