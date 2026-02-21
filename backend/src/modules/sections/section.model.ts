import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { mongooseTenantPlugin } from "../../core/mongooseTenantPlugin";

export type Section = {
    tenantId: Types.ObjectId;
    name: string;
    code: string;
    classId: Types.ObjectId;
    capacity?: number;
    isActive: boolean;
    nameSearch?: string;
    codeSearch?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type SectionDocument = HydratedDocument<Section>;

const SectionSchema = new Schema<Section>(
    {
        tenantId: { type: Schema.Types.ObjectId, required: true, ref: "Tenant" },
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, trim: true, uppercase: true },
        classId: { type: Schema.Types.ObjectId, required: true, ref: "SchoolClass" },
        capacity: { type: Number, min: 1 },
        isActive: { type: Boolean, default: true },
        nameSearch: { type: String, required: true, select: false },
        codeSearch: { type: String, required: true, select: false },
    },
    { timestamps: true }
);

SectionSchema.pre("validate", function setSearchFields() {
    this.nameSearch = this.name.trim().toLowerCase();
    this.codeSearch = this.code.trim().toLowerCase();
});

SectionSchema.index({ tenantId: 1, classId: 1, code: 1 }, { unique: true });
SectionSchema.index({ tenantId: 1, classId: 1, isActive: 1 });
SectionSchema.index({ tenantId: 1, createdAt: -1 });
SectionSchema.index({ tenantId: 1, nameSearch: 1 });
SectionSchema.index({ tenantId: 1, codeSearch: 1 });
SectionSchema.plugin(mongooseTenantPlugin);

export const SectionModel = model<Section>("Section", SectionSchema);
