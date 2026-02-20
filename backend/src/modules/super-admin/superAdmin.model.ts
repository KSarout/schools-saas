import { Schema, model, type HydratedDocument } from "mongoose";

export type SuperAdmin = {
    name: string;
    email: string;
    passwordHash: string;
    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
};

export type SuperAdminDocument = HydratedDocument<SuperAdmin>;

const SuperAdminSchema = new Schema<SuperAdmin>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        passwordHash: { type: String, required: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

SuperAdminSchema.index({ email: 1 }, { unique: true });

export const SuperAdminModel = model<SuperAdmin>("SuperAdmin", SuperAdminSchema);
