import {Schema, model, type HydratedDocument, type Types} from "mongoose";
import { mongooseTenantPlugin } from "../../../core/mongooseTenantPlugin";

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
    firstNameSearch?: string;
    lastNameSearch?: string;
    studentCodeSearch?: string;
    studentIdSearch?: string;
    parentPhoneSearch?: string;

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
        firstNameSearch: {type: String, required: true, index: true, select: false},
        lastNameSearch: {type: String, required: true, index: true, select: false},
        studentCodeSearch: {type: String, required: true, index: true, select: false},
        studentIdSearch: {type: String, required: true, index: true, select: false},
        parentPhoneSearch: {type: String, select: false},

        status: {type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE"},
    },
    {timestamps: true}
);

function normalizeSearch(value: string | undefined) {
    return (value ?? "").trim().toLowerCase();
}

StudentSchema.pre("validate", function setSearchFields() {
    this.firstNameSearch = normalizeSearch(this.firstName);
    this.lastNameSearch = normalizeSearch(this.lastName);
    this.studentCodeSearch = normalizeSearch(this.studentCode);
    this.studentIdSearch = normalizeSearch(this.studentId);
    this.parentPhoneSearch = normalizeSearch(this.parentPhone) || undefined;
});

// Uniqueness & performance (multi-tenant)
StudentSchema.index({tenantId: 1, studentCode: 1}, {unique: true});
StudentSchema.index({tenantId: 1, studentId: 1}, {unique: true});
StudentSchema.index({tenantId: 1, status: 1, createdAt: -1, _id: -1});
StudentSchema.index({tenantId: 1, studentCodeSearch: 1});
StudentSchema.index({tenantId: 1, studentIdSearch: 1});
StudentSchema.index({tenantId: 1, firstNameSearch: 1});
StudentSchema.index({tenantId: 1, lastNameSearch: 1});
StudentSchema.index({tenantId: 1, parentPhoneSearch: 1});
StudentSchema.plugin(mongooseTenantPlugin);

export const StudentModel = model<Student>("Student", StudentSchema);
