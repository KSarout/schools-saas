import test from "node:test";
import assert from "node:assert/strict";
import { buildTenantListFilter, tenantListSort } from "../service/tenant.search";

test("buildTenantListFilter returns empty filter when q is not provided", () => {
    assert.deepEqual(buildTenantListFilter(), {});
});

test("buildTenantListFilter uses escaped, lowercase prefix regex", () => {
    assert.deepEqual(buildTenantListFilter("Ac(me)"), {
        $or: [
            { nameSearch: { $regex: "^ac\\(me\\)" } },
            { slugSearch: { $regex: "^ac\\(me\\)" } },
        ],
    });
});

test("tenant list sort is stable and deterministic", () => {
    assert.deepEqual(tenantListSort, { createdAt: -1, _id: -1 });
});
