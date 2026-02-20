import type {Types} from "mongoose";
import {CounterModel, type CounterKey} from "../model/counter.model";
import { tenantFindOneAndUpdate } from "../../../core/tenantModel";

export async function nextSequence(tenantId: Types.ObjectId, key: CounterKey) {
    const doc = await tenantFindOneAndUpdate(
        CounterModel,
        {key},
        {$inc: {seq: 1}},
        { tenantId },
        {upsert: true, returnDocument: "after"}
    );

    // if (!doc) throw new Error("Failed to generate sequence");
    if (!doc || typeof doc.seq !== "number") throw new Error("Failed to generate sequence");
    return doc.seq;
}
