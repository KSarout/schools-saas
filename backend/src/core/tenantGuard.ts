import type { Request, Response, NextFunction } from "express";
import { sendError } from "./apiResponse";

export function requireTenantMatch(req: Request, res: Response, next: NextFunction) {
    if (!req.user) return sendError(res, 401, "Unauthorized");
    if (!req.tenant) return sendError(res, 400, "Missing tenant context");

    if (req.user.tenantId !== req.tenant.id) {
        return sendError(res, 403, "Tenant mismatch");
    }

    next();
}
