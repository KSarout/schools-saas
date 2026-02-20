import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export type CounterKey = string; // extend later: "INVOICE", "RECEIPT", etc.

export type Counter = {
    tenantId: Types.ObjectId;
    key: CounterKey;
    seq: number;

    createdAt: Date;
    updatedAt: Date;
};

export type CounterDocument = HydratedDocument<Counter>;

const CounterSchema = new Schema<Counter>(
    {
        tenantId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Tenant" },
        key: { type: String, required: true, enum: ["STUDENT"] },
        seq: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);


CounterSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const CounterModel = model<Counter>("Counter", CounterSchema);
