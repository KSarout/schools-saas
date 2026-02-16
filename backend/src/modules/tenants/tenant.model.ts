import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Tenant =
    mongoose.model("Tenant", TenantSchema);
