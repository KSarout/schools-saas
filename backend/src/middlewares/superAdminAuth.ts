import { Request, Response, NextFunction } from "express";
import { verifySuperAdminAccessToken } from "../utils/jwt";
import { sendError } from "../core/apiResponse";

export function superAdminAuth(req: Request, res: Response, next: NextFunction) {
    const auth = req.header("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) return sendError(res, 401, "Missing token");

    try {
        const decoded = verifySuperAdminAccessToken(token);

        if (decoded.role !== "SUPER_ADMIN")
            return sendError(res, 403, "Forbidden");

        req.superAdmin = decoded;
        next();
    } catch {
        return sendError(res, 401, "Invalid token");
    }
}
