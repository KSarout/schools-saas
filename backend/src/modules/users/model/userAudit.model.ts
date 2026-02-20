import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { mongooseTenantPlugin } from "../../../core/mongooseTenantPlugin";

export type UserAuditAction =
    | "USER_CREATED"
    | "USER_UPDATED"
    | "USER_PASSWORD_RESET"
    | "USER_DEACTIVATED";

export type UserAuditLog = {
    tenantId: Types.ObjectId;
    actorUserId: Types.ObjectId;
    action: UserAuditAction;
    targetUserId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

export type UserAuditLogDocument = HydratedDocument<UserAuditLog>;

const UserAuditLogSchema = new Schema<UserAuditLog>(
    {
        tenantId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Tenant" },
        actorUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        action: {
            type: String,
            enum: ["USER_CREATED", "USER_UPDATED", "USER_PASSWORD_RESET", "USER_DEACTIVATED"],
            required: true,
        },
        targetUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    },
    { timestamps: true }
);

UserAuditLogSchema.index({ tenantId: 1, createdAt: -1 });
UserAuditLogSchema.index({ tenantId: 1, targetUserId: 1, createdAt: -1 });
UserAuditLogSchema.plugin(mongooseTenantPlugin);

export const UserAuditLogModel = model<UserAuditLog>("UserAuditLog", UserAuditLogSchema);
