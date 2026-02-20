import {Schema, model, type HydratedDocument, type Types} from "mongoose";

export type TenantPlan = "FREE" | "PRO";
export type Tenant = {
    name: string;
    slug: string;
    nameSearch?: string;
    slugSearch?: string;
    isActive: boolean;
    plan: TenantPlan;

    createdAt: Date;
    updatedAt: Date;
};

export type TenantDocument = HydratedDocument<Tenant>;

const TenantSchema = new Schema<Tenant>(
    {
        name: {type: String, required: true, trim: true},
        slug: {type: String, required: true, trim: true, lowercase: true},
        nameSearch: {type: String, required: true, index: true, select: false},
        slugSearch: {type: String, required: true, index: true, select: false},
        isActive: {type: Boolean, default: true},
        plan: {type: String, enum: ["FREE", "PRO"], default: "FREE"},
    },
    {timestamps: true}
);

TenantSchema.index({slug: 1}, {unique: true});
TenantSchema.index({createdAt: -1, _id: -1});
TenantSchema.index({slugSearch: 1, createdAt: -1, _id: -1});
TenantSchema.index({nameSearch: 1, createdAt: -1, _id: -1});

TenantSchema.pre("validate", function setSearchFields() {
    this.nameSearch = this.name.trim().toLowerCase();
    this.slugSearch = this.slug.trim().toLowerCase();
});

export const TenantModel = model<Tenant>("Tenant", TenantSchema);
