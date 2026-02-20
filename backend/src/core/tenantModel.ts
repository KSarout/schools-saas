import type { Model, UpdateQuery, QueryFilter } from "mongoose";

type TenantOpts = { tenantId: string };

export function tenantFind<T>(model: Model<T>, filter: QueryFilter<T>, opts: TenantOpts) {
    return model.find(filter).setOptions({ tenantId: opts.tenantId });
}

export function tenantFindOne<T>(model: Model<T>, filter: QueryFilter<T>, opts: TenantOpts) {
    return model.findOne(filter).setOptions({ tenantId: opts.tenantId });
}

export function tenantCreate<T extends { tenantId: any }>(model: Model<T>, doc: Omit<T, "tenantId">, opts: TenantOpts) {
    return model.create({ ...doc, tenantId: opts.tenantId } as any);
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
