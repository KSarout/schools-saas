import {Schema, model, type HydratedDocument, type Types} from "mongoose";

export type StudentGender = "MALE" | "FEMALE";
export type StudentStatus = "ACTIVE" | "INACTIVE";

export type Student = {
    tenantId: Types.ObjectId;

    studentCode: string; // generated: STU-YYYY-000123
    studentId: string;   // school internal/legacy id

    firstName: string;
    lastName: string;
    gender: StudentGender;

    dateOfBirth?: Date;

    grade: string;
    section: string;

    parentName?: string;
    parentPhone?: string;
    address?: string;

    status: StudentStatus;

    createdAt: Date;
    updatedAt: Date;
};

export type StudentDocument = HydratedDocument<Student>;

const StudentSchema = new Schema<Student>(
    {
        tenantId: {type: Schema.Types.ObjectId, required: true, index: true, ref: "Tenant"},

        studentCode: {type: String, required: true, trim: true},
        studentId: {type: String, required: true, trim: true},

        firstName: {type: String, required: true, trim: true},
        lastName: {type: String, required: true, trim: true},
        gender: {type: String, enum: ["MALE", "FEMALE"], required: true},

        dateOfBirth: {type: Date},

        grade: {type: String, required: true, trim: true},
        section: {type: String, required: true, trim: true},

        parentName: {type: String, trim: true},
        parentPhone: {type: String, trim: true},
        address: {type: String, trim: true},

        status: {type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE"},
    },
    {timestamps: true}
);

// Uniqueness & performance (multi-tenant)
StudentSchema.index({tenantId: 1, studentCode: 1}, {unique: true});
StudentSchema.index({tenantId: 1, studentId: 1}, {unique: true});
StudentSchema.index({tenantId: 1, createdAt: -1});

export const StudentModel = model<Student>("Student", StudentSchema);
