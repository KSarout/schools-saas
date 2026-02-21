import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { mongooseTenantPlugin } from "../../core/mongooseTenantPlugin";

export type AcademicYear = {
    tenantId: Types.ObjectId;
    name: string;
    code: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    isCurrent: boolean;
    nameSearch?: string;
    codeSearch?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type AcademicYearDocument = HydratedDocument<AcademicYear>;

const AcademicYearSchema = new Schema<AcademicYear>(
    {
        tenantId: { type: Schema.Types.ObjectId, required: true, ref: "Tenant" },
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, trim: true, uppercase: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
        isCurrent: { type: Boolean, default: false },
        nameSearch: { type: String, required: true, select: false },
        codeSearch: { type: String, required: true, select: false },
    },
    { timestamps: true }
);

AcademicYearSchema.pre("validate", function setSearchFields() {
    this.nameSearch = this.name.trim().toLowerCase();
    this.codeSearch = this.code.trim().toLowerCase();
});

AcademicYearSchema.index({ tenantId: 1, code: 1 }, { unique: true });
AcademicYearSchema.index(
    { tenantId: 1, isCurrent: 1 },
    { unique: true, partialFilterExpression: { isCurrent: true } }
);
AcademicYearSchema.index({ tenantId: 1, isActive: 1 });
AcademicYearSchema.index({ tenantId: 1, startDate: -1 });
AcademicYearSchema.index({ tenantId: 1, createdAt: -1 });
AcademicYearSchema.index({ tenantId: 1, nameSearch: 1 });
AcademicYearSchema.index({ tenantId: 1, codeSearch: 1 });
AcademicYearSchema.plugin(mongooseTenantPlugin);

export const AcademicYearModel = model<AcademicYear>("AcademicYear", AcademicYearSchema);
