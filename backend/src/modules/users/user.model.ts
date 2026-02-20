import {Schema, model, type HydratedDocument, type Types} from "mongoose";

export type SchoolRole = "SCHOOL_ADMIN" | "TEACHER" | "ACCOUNTANT";

export type User = {
    tenantId: Types.ObjectId;

    name: string;
    email: string;
    passwordHash: string;

    role: SchoolRole;

    mustChangePassword: boolean;
    isActive: boolean;

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
    },
    {timestamps: true}
);

// Enforce uniqueness per tenant
UserSchema.index({tenantId: 1, email: 1}, {unique: true});

export const UserModel = model<User>("User", UserSchema);
