import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import { buildListResponse, paginationQuerySchema } from "./listResponse";

test("paginationQuerySchema parses valid values from strings", () => {
    const parsed = paginationQuerySchema.parse({ page: "2", limit: "25" });
    assert.deepEqual(parsed, { page: 2, limit: 25 });
});

test("paginationQuerySchema applies defaults", () => {
    const parsed = paginationQuerySchema.parse({});
    assert.deepEqual(parsed, { page: 1, limit: 10 });
});

test("paginationQuerySchema rejects invalid values", () => {
    const result = paginationQuerySchema.safeParse({ page: "abc", limit: "0" });
    assert.equal(result.success, false);
});

test("buildListResponse returns enterprise list shape", () => {
    const response = buildListResponse({
        items: [{ id: "1" }],
        total: 51,
        page: 2,
        limit: 25,
    });

    assert.deepEqual(response, {
        items: [{ id: "1" }],
        total: 51,
        page: 2,
        limit: 25,
        totalPages: 3,
    });
});

test("buildListResponse never returns less than one page", () => {
    const response = buildListResponse({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
    });

    assert.equal(response.totalPages, 1);
});

test("paginationQuerySchema can be safely composed", () => {
    const schema = paginationQuerySchema.extend({
        q: z.string().optional().default(""),
    });

    const parsed = schema.parse({ q: "abc", page: "1", limit: "10" });
    assert.equal(parsed.q, "abc");
});
