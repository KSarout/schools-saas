import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TenantModel} from "../modules/tenants/tenant.model";

const headerSchema = z.string().min(1).max(80).regex(/^[a-z0-9-]+$/);

export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
    const raw = req.header("X-Tenant");

    if (!raw) return res.status(400).json({ error: "Missing X-Tenant header" });

    const parsed = headerSchema.safeParse(raw.toLowerCase().trim());
    if (!parsed.success) return res.status(400).json({ error: "Invalid X-Tenant header" });

    const slug = parsed.data;

    const tenant = await TenantModel.findOne({ slug, isActive: true }).lean();
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    req.tenant = { id: tenant._id.toString(), slug: tenant.slug, name: tenant.name };
    next();
}
