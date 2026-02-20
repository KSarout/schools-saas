import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TenantModel} from "../modules/tenants/model/tenant.model";
import { sendError } from "./apiResponse";

const headerSchema = z.string().min(1).max(80).regex(/^[a-z0-9-]+$/);

export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
    const raw = req.header("X-Tenant");

    if (!raw) return sendError(res, 400, "Missing X-Tenant header");

    const parsed = headerSchema.safeParse(raw.toLowerCase().trim());
    if (!parsed.success) return sendError(res, 400, "Invalid X-Tenant header", parsed.error.issues);

    const slug = parsed.data;

    const tenant = await TenantModel.findOne({ slug, isActive: true }).lean();
    if (!tenant) return sendError(res, 404, "Tenant not found");

    req.tenant = { id: tenant._id.toString(), slug: tenant.slug, name: tenant.name };
    next();
}
