import { Schema, model, type HydratedDocument } from "mongoose";

export type SuperAdmin = {
    name: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
    nameSearch?: string;
    emailSearch?: string;

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
        nameSearch: { type: String, required: true, select: false },
        emailSearch: { type: String, required: true, select: false },
    },
    { timestamps: true }
);

SuperAdminSchema.pre("validate", function setSearchFields() {
    this.nameSearch = this.name.trim().toLowerCase();
    this.emailSearch = this.email.trim().toLowerCase();
});

SuperAdminSchema.index({ email: 1 }, { unique: true });
SuperAdminSchema.index({ isActive: 1, createdAt: -1, _id: -1 });
SuperAdminSchema.index({ nameSearch: 1 });
SuperAdminSchema.index({ emailSearch: 1 });

export const SuperAdminModel = model<SuperAdmin>("SuperAdmin", SuperAdminSchema);
