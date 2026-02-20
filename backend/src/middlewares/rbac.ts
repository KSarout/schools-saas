import { Request, Response, NextFunction } from "express";
import { SchoolRole } from "../types/jwt";
import { sendError } from "../core/apiResponse";
import {
    schoolPermissionMatrix,
    type SchoolPermission,
    superAdminPermissionMatrix,
    type SuperAdminPermission,
} from "../core/permissions";

function forbidden(res: Response, message = "Forbidden") {
    return sendError(res, 403, message);
}

export function requireRole(...roles: SchoolRole[]) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        if (!req.user)
            return sendError(res, 401, "Unauthorized");

        if (!roles.includes(<"SCHOOL_ADMIN" | "TEACHER" | "ACCOUNTANT">req.user.role))
            return forbidden(res);

        next();
    };
}

export function requireSchoolPermission(permission: SchoolPermission) {
    const roles = schoolPermissionMatrix[permission];
    return requireRole(...roles);
}

export function requireSuperAdminPermission(permission: SuperAdminPermission) {
    const roles = superAdminPermissionMatrix[permission];

    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.superAdmin) {
            return sendError(res, 401, "Unauthorized");
        }

        const role = req.superAdmin.role as string;
        if (!roles.includes(role as "SUPER_ADMIN")) {
            return forbidden(res);
        }

        next();
    };
}
