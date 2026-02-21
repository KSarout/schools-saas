import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { mongooseTenantPlugin } from "../../../core/mongooseTenantPlugin";

export type EnrollmentAuditAction = "ASSIGN" | "TRANSFER" | "PROMOTE" | "WITHDRAW";

type PlacementRef = {
    academicYearId?: Types.ObjectId;
    classId?: Types.ObjectId;
    sectionId?: Types.ObjectId;
};

export type EnrollmentAuditLog = {
    tenantId: Types.ObjectId;
    actorUserId: Types.ObjectId;
    action: EnrollmentAuditAction;
    studentId: Types.ObjectId;
    from?: PlacementRef;
    to?: PlacementRef;
    effectiveDate?: Date;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type EnrollmentAuditLogDocument = HydratedDocument<EnrollmentAuditLog>;

const PlacementRefSchema = new Schema<PlacementRef>(
    {
        academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear" },
        classId: { type: Schema.Types.ObjectId, ref: "SchoolClass" },
        sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
    },
    { _id: false }
);

const EnrollmentAuditLogSchema = new Schema<EnrollmentAuditLog>(
    {
        tenantId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Tenant" },
        actorUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        action: { type: String, enum: ["ASSIGN", "TRANSFER", "PROMOTE", "WITHDRAW"], required: true },
        studentId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Student" },
        from: { type: PlacementRefSchema, required: false },
        to: { type: PlacementRefSchema, required: false },
        effectiveDate: { type: Date, required: false },
        note: { type: String, required: false },
    },
    { timestamps: true }
);

EnrollmentAuditLogSchema.index({ tenantId: 1, createdAt: -1 });
EnrollmentAuditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });
EnrollmentAuditLogSchema.index({ tenantId: 1, studentId: 1, createdAt: -1 });
EnrollmentAuditLogSchema.plugin(mongooseTenantPlugin);

export const EnrollmentAuditLogModel = model<EnrollmentAuditLog>("EnrollmentAuditLog", EnrollmentAuditLogSchema);
