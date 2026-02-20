import { SchoolJwtPayload, SuperAdminJwtPayload } from "./jwt";

declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            user?: SchoolJwtPayload;
            superAdmin?: SuperAdminJwtPayload;
            tenant?: any;
        }
    }
}

export {};
