import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { mongooseTenantPlugin } from "../../core/mongooseTenantPlugin";

export type SchoolClass = {
    tenantId: Types.ObjectId;
    name: string;
    code: string;
    level: string;
    capacity?: number;
    isActive: boolean;
    academicYearId: Types.ObjectId;
    homeroomTeacherId?: Types.ObjectId;
    nameSearch?: string;
    codeSearch?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type SchoolClassDocument = HydratedDocument<SchoolClass>;

const SchoolClassSchema = new Schema<SchoolClass>(
    {
        tenantId: { type: Schema.Types.ObjectId, required: true, ref: "Tenant" },
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, trim: true, uppercase: true },
        level: { type: String, required: true, trim: true },
        capacity: { type: Number, min: 1 },
        isActive: { type: Boolean, default: true },
        academicYearId: { type: Schema.Types.ObjectId, required: true, ref: "AcademicYear" },
        homeroomTeacherId: { type: Schema.Types.ObjectId, ref: "User" },
        nameSearch: { type: String, required: true, select: false },
        codeSearch: { type: String, required: true, select: false },
    },
    { timestamps: true }
);

SchoolClassSchema.pre("validate", function setSearchFields() {
    this.nameSearch = this.name.trim().toLowerCase();
    this.codeSearch = this.code.trim().toLowerCase();
});

SchoolClassSchema.index({ tenantId: 1, academicYearId: 1, code: 1 }, { unique: true });
SchoolClassSchema.index({ tenantId: 1, level: 1 });
SchoolClassSchema.index({ tenantId: 1, isActive: 1 });
SchoolClassSchema.index({ tenantId: 1, createdAt: -1 });
SchoolClassSchema.index({ tenantId: 1, academicYearId: 1, createdAt: -1 });
SchoolClassSchema.index({ tenantId: 1, homeroomTeacherId: 1 });
SchoolClassSchema.index({ tenantId: 1, nameSearch: 1 });
SchoolClassSchema.index({ tenantId: 1, codeSearch: 1 });
SchoolClassSchema.plugin(mongooseTenantPlugin);

export const SchoolClassModel = model<SchoolClass>("SchoolClass", SchoolClassSchema);
