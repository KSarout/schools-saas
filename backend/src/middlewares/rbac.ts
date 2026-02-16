import { Request, Response, NextFunction } from "express";
import { SchoolRole } from "../types/jwt";

export function requireRole(...roles: SchoolRole[]) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });

        if (!roles.includes(req.user.role))
            return res.status(403).json({ error: "Forbidden" });

        next();
    };
}
