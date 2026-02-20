import { Types, type Types as MongooseTypes } from "mongoose";
import { tenantCreate } from "../../../core/tenantModel";
import { type UserAuditAction, UserAuditLogModel } from "../model/userAudit.model";

type TenantId = MongooseTypes.ObjectId | string;
type UserId = MongooseTypes.ObjectId | string;

function toObjectId(id: UserId) {
    return id instanceof Types.ObjectId ? id : new Types.ObjectId(String(id));
}

export function createUserAuditLogForTenant(
    tenantId: TenantId,
    data: {
        actorUserId: UserId;
        action: UserAuditAction;
        targetUserId: UserId;
    }
) {
    return tenantCreate(
        UserAuditLogModel,
        {
            actorUserId: toObjectId(data.actorUserId),
            action: data.action,
            targetUserId: toObjectId(data.targetUserId),
        },
        { tenantId }
    );
}
