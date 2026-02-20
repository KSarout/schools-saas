import type { Request, Response, NextFunction } from "express";

export function requireTenantMatch(req: Request, res: Response, next: NextFunction) {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!req.tenant) return res.status(400).json({ error: "Missing tenant context" });

    if (req.user.tenantId !== req.tenant.id) {
        return res.status(403).json({ error: "Tenant mismatch" });
    }

    next();
}
