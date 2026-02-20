import {Schema, model, type HydratedDocument, type Types} from "mongoose";
import { mongooseTenantPlugin } from "../../../core/mongooseTenantPlugin";

export type SchoolRole = "SCHOOL_ADMIN" | "TEACHER" | "ACCOUNTANT";

export type User = {
    tenantId: Types.ObjectId;

    name: string;
    email: string;
    passwordHash: string;

    role: SchoolRole;

    mustChangePassword: boolean;
    isActive: boolean;
    nameSearch?: string;
    emailSearch?: string;

    createdAt: Date;
    updatedAt: Date;
};

export type UserDocument = HydratedDocument<User>;

const UserSchema = new Schema<User>(
    {
        tenantId: {type: Schema.Types.ObjectId, required: true, index: true, ref: "Tenant"},

        name: {type: String, required: true, trim: true},
        email: {type: String, required: true, trim: true, lowercase: true},
        passwordHash: {type: String, required: true},

        role: {type: String, enum: ["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"], required: true},

        mustChangePassword: {type: Boolean, default: true},
        isActive: {type: Boolean, default: true},
        nameSearch: { type: String, required: true, select: false },
        emailSearch: { type: String, required: true, select: false },
    },
    {timestamps: true}
);

UserSchema.pre("validate", function setSearchFields() {
    this.nameSearch = this.name.trim().toLowerCase();
    this.emailSearch = this.email.trim().toLowerCase();
});

// Enforce uniqueness per tenant
UserSchema.index({tenantId: 1, email: 1}, {unique: true});
UserSchema.index({tenantId: 1, role: 1});
UserSchema.index({tenantId: 1, isActive: 1});
UserSchema.index({tenantId: 1, createdAt: 1});
UserSchema.index({tenantId: 1, nameSearch: 1});
UserSchema.index({tenantId: 1, emailSearch: 1});
UserSchema.plugin(mongooseTenantPlugin);

export const UserModel = model<User>("User", UserSchema);
