import { SchoolJwtPayload, SuperAdminJwtPayload } from "./jwt";

declare global {
    namespace Express {
        interface Request {
            user?: SchoolJwtPayload;
            superAdmin?: SuperAdminJwtPayload;
            tenant?: any;
        }
    }
}

export {};
