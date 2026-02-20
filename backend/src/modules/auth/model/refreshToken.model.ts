import { Schema, model, type HydratedDocument } from "mongoose";

export type RefreshTokenSubjectType = "SCHOOL_USER" | "SUPER_ADMIN";

export type RefreshToken = {
    tokenId: string;
    subjectType: RefreshTokenSubjectType;
    subjectId: string;
    tenantId?: string;
    role: string;
    revokedAt?: Date;
    replacedByTokenId?: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

const RefreshTokenSchema = new Schema<RefreshToken>(
    {
        tokenId: { type: String, required: true, unique: true, index: true },
        subjectType: { type: String, enum: ["SCHOOL_USER", "SUPER_ADMIN"], required: true, index: true },
        subjectId: { type: String, required: true, index: true },
        tenantId: { type: String, index: true },
        role: { type: String, required: true },
        revokedAt: { type: Date },
        replacedByTokenId: { type: String },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model<RefreshToken>("RefreshToken", RefreshTokenSchema);
