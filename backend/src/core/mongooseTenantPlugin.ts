import type mongoose from "mongoose";

type TenantQueryOptions = { tenantId?: string };

function getTenantId(query: mongoose.Query<any, any>) {
    const opts = (query.getOptions?.() ?? {}) as TenantQueryOptions;
    return opts.tenantId;
}

// ✅ Named export
export function mongooseTenantPlugin(schema: mongoose.Schema) {
    function enforce(this: mongoose.Query<any, any>) {
        const tenantId = getTenantId(this);
        if (!tenantId) throw new Error("Missing tenantId in query options");
        this.where({ tenantId });
    }

    schema.pre(/^find/, enforce);
    schema.pre("countDocuments", enforce);
    schema.pre(
        ["updateOne", "updateMany", "deleteOne", "deleteMany", "findOneAndUpdate", "findOneAndDelete"],
        enforce
    );
}
