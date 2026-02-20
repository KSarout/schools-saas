import {Schema, model, type HydratedDocument, type Types} from "mongoose";

export type TenantPlan = "FREE" | "PRO";
export type Tenant = {
    name: string;
    slug: string;
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
        isActive: {type: Boolean, default: true},
        plan: {type: String, enum: ["FREE", "PRO"], default: "FREE"},
    },
    {timestamps: true}
);

TenantSchema.index({slug: 1}, {unique: true});

export const TenantModel = model<Tenant>("Tenant", TenantSchema);
