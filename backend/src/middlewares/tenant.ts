import {Request, Response, NextFunction} from "express";
import {TenantModel} from "../modules/tenants/model/tenant.model";
import { sendError } from "../core/apiResponse";


export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
    const slug = req.header("X-Tenant");
    if (!slug) return sendError(res, 400, "Missing X-Tenant header");

    const tenant = await TenantModel.findOne({slug, isActive: true});
    if (!tenant) return sendError(res, 404, "Tenant not found");

    req.tenant = tenant;
    next();
}
