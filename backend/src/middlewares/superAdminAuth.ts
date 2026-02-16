import { Request, Response, NextFunction } from "express";
import { verifySuperAdminAccessToken } from "../utils/jwt";

export function superAdminAuth(req: Request, res: Response, next: NextFunction) {
    const auth = req.header("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
        const decoded = verifySuperAdminAccessToken(token);

        if (decoded.role !== "SUPER_ADMIN")
            return res.status(403).json({ error: "Forbidden" });

        req.superAdmin = decoded;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
