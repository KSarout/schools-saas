import {Request, Response, NextFunction} from "express";
import {TenantModel} from "../modules/tenants/tenant.model";


export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
    const slug = req.header("X-Tenant");
    if (!slug) return res.status(400).json({error: "Missing X-Tenant header"});

    const tenant = await TenantModel.findOne({slug, isActive: true});
    if (!tenant) return res.status(404).json({error: "Tenant not found"});

    req.tenant = tenant;
    next();
}
