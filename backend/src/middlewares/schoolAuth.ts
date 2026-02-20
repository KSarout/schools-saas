import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import {verifySchoolAccessToken} from "../utils/jwt";

declare global {
    namespace Express {
        interface Request {
            user?: { userId: Types.ObjectId; tenantId: Types.ObjectId; role: string };
        }
    }
}

export function schoolAuth(req: Request, res: Response, next: NextFunction) {
    const auth = req.header("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
        const decoded = verifySchoolAccessToken(token);
        req.user = {
            userId: new Types.ObjectId(decoded.userId),
            tenantId: new Types.ObjectId(decoded.tenantId),
            role: decoded.role,
        };
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
