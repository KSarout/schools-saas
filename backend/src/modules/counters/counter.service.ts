import type {Types} from "mongoose";
import {CounterModel, type CounterKey} from "./counter.model";

export async function nextSequence(tenantId: Types.ObjectId, key: CounterKey) {
    const doc = await CounterModel.findOneAndUpdate(
        {tenantId, key},
        {$inc: {seq: 1}},
        {upsert: true, returnDocument: "after"}
    );

    // if (!doc) throw new Error("Failed to generate sequence");
    if (!doc || typeof doc.seq !== "number") throw new Error("Failed to generate sequence");
    return doc.seq;
}
