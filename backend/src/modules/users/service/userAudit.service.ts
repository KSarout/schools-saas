import type { Types } from "mongoose";
import { logger } from "../../../core/logger";
import { type UserAuditAction } from "../model/userAudit.model";
import { createUserAuditLogForTenant } from "./userAudit.repo";

type TenantId = Types.ObjectId | string;
type UserId = Types.ObjectId | string;

export async function logUserAuditAction(params: {
    tenantId: TenantId;
    actorUserId: UserId;
    action: UserAuditAction;
    targetUserId: UserId;
}) {
    try {
        await createUserAuditLogForTenant(params.tenantId, {
            actorUserId: params.actorUserId,
            action: params.action,
            targetUserId: params.targetUserId,
        });
    } catch (error) {
        logger.error("users.audit.write_failed", {
            tenantId: String(params.tenantId),
            actorUserId: String(params.actorUserId),
            targetUserId: String(params.targetUserId),
            action: params.action,
            error,
        });
    }
}
