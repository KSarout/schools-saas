import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { mongooseTenantPlugin } from "../../../core/mongooseTenantPlugin";

export type EnrollmentStatus = "ACTIVE" | "TRANSFERRED" | "PROMOTED" | "WITHDRAWN";

export type Enrollment = {
    tenantId: Types.ObjectId;
    studentId: Types.ObjectId;
    academicYearId: Types.ObjectId;
    classId: Types.ObjectId;
    sectionId: Types.ObjectId;
    status: EnrollmentStatus;
    startDate: Date;
    endDate?: Date;
    note?: string;
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

export type EnrollmentDocument = HydratedDocument<Enrollment>;

const EnrollmentSchema = new Schema<Enrollment>(
    {
        tenantId: { type: Schema.Types.ObjectId, required: true, ref: "Tenant", index: true },
        studentId: { type: Schema.Types.ObjectId, required: true, ref: "Student", index: true },
        academicYearId: { type: Schema.Types.ObjectId, required: true, ref: "AcademicYear", index: true },
        classId: { type: Schema.Types.ObjectId, required: true, ref: "SchoolClass", index: true },
        sectionId: { type: Schema.Types.ObjectId, required: true, ref: "Section", index: true },
        status: {
            type: String,
            enum: ["ACTIVE", "TRANSFERRED", "PROMOTED", "WITHDRAWN"],
            default: "ACTIVE",
            required: true,
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        note: { type: String, trim: true },
        createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    {
        timestamps: true,
        collection: "enrollments",
    }
);

EnrollmentSchema.index(
    { tenantId: 1, studentId: 1, academicYearId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "ACTIVE" },
        name: "uniq_active_enrollment_per_student_year",
    }
);
EnrollmentSchema.index({ tenantId: 1, studentId: 1, academicYearId: 1, status: 1 });
EnrollmentSchema.index({ tenantId: 1, studentId: 1, startDate: -1, _id: -1 });
EnrollmentSchema.index({ tenantId: 1, academicYearId: 1, classId: 1, sectionId: 1, status: 1 });
EnrollmentSchema.plugin(mongooseTenantPlugin);

export const EnrollmentModel = model<Enrollment>("Enrollment", EnrollmentSchema);
