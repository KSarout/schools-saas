import mongoose from "mongoose";

export type StudentStatus = "ACTIVE" | "INACTIVE";
export type Gender = "MALE" | "FEMALE";

const StudentSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },

        studentId: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },

        gender: {
            type: String,
            enum: ["MALE", "FEMALE"],
            required: true,
        },

        dateOfBirth: { type: Date },

        grade: { type: String, required: true },
        section: { type: String, required: true },

        parentName: { type: String },
        parentPhone: { type: String },

        address: { type: String },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
        },
    },
    { timestamps: true }
);

// Unique studentId per tenant
StudentSchema.index({ tenantId: 1, studentId: 1 }, { unique: true });

// Search index (basic)
StudentSchema.index({ tenantId: 1, firstName: 1, lastName: 1 });

export const Student = mongoose.model("Student", StudentSchema);
