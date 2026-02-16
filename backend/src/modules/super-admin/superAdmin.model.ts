import mongoose from "mongoose";

const SuperAdminSchema = new mongoose.Schema(
    {
        email: { type: String, unique: true },
        passwordHash: { type: String, required: true },
    },
    { timestamps: true }
);

export const SuperAdmin =
    mongoose.model("SuperAdmin", SuperAdminSchema);
