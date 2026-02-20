import type { Model, UpdateQuery, QueryFilter, Types } from "mongoose";

type TenantId = string | Types.ObjectId;
type TenantOpts = { tenantId: TenantId };
type TenantCreateInput<T> = Omit<T, "tenantId" | "createdAt" | "updatedAt">;

export function tenantFind<T>(model: Model<T>, filter: QueryFilter<T>, opts: TenantOpts) {
    return model.find(filter).setOptions({ tenantId: opts.tenantId });
}

export function tenantFindOne<T>(model: Model<T>, filter: QueryFilter<T>, opts: TenantOpts) {
    return model.findOne(filter).setOptions({ tenantId: opts.tenantId });
}

export function tenantCreate<T extends { tenantId: any }>(model: Model<T>, doc: TenantCreateInput<T>, opts: TenantOpts) {
    return model.create({ ...doc, tenantId: opts.tenantId } as any);
}

export function tenantCountDocuments<T>(model: Model<T>, filter: QueryFilter<T>, opts: TenantOpts) {
    return model.countDocuments(filter).setOptions({ tenantId: opts.tenantId });
}

export function tenantFindOneAndUpdate<T>(
    model: Model<T>,
    filter: QueryFilter<T>,
    update: UpdateQuery<T>,
    opts: TenantOpts,
    options?: Record<string, unknown>
) {
    return model.findOneAndUpdate(filter, update, options).setOptions({ tenantId: opts.tenantId });
}

export function tenantUpdateOne<T>(
    model: Model<T>,
    filter: QueryFilter<T>,
    update: UpdateQuery<T>,
    opts: TenantOpts
) {
    return model.updateOne(filter, update).setOptions({ tenantId: opts.tenantId });
}

export function tenantDeleteOne<T>(model: Model<T>, filter: QueryFilter<T>, opts: TenantOpts) {
    return model.deleteOne(filter).setOptions({ tenantId: opts.tenantId });
}
