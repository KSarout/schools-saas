import { Request, Response, NextFunction } from "express";
import { verifySchoolAccessToken } from "../utils/jwt";

export function schoolAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const auth = req.header("Authorization") || "";
    const token = auth.startsWith("Bearer ")
        ? auth.slice(7)
        : "";

    if (!token)
        return res.status(401).json({ error: "Missing token" });

    try {
        req.user = verifySchoolAccessToken(token);
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
