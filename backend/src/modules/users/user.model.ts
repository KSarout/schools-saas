import mongoose from "mongoose";
import { SchoolRole } from "../../types/jwt";

const UserSchema = new mongoose.Schema(
    {
            tenantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Tenant",
                    required: true,
                    index: true,
            },

            name: { type: String, required: true },
            email: { type: String, required: true },

            role: {
                    type: String,
                    enum: ["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"],
                    required: true,
            },

            passwordHash: { type: String, required: true },

            mustChangePassword: {
                    type: Boolean,
                    default: true,
            },

            isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

UserSchema.index(
    { tenantId: 1, email: 1 },
    { unique: true }
);

export const User =
    mongoose.model("User", UserSchema);
