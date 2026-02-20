import test from "node:test";
import assert from "node:assert/strict";
import { buildUserListFilter, userListSort } from "../service/user.search";

test("buildUserListFilter supports role/status filters", () => {
    assert.deepEqual(buildUserListFilter({ role: "TEACHER", status: "ACTIVE" }), {
        role: "TEACHER",
        isActive: true,
    });
});

test("buildUserListFilter uses escaped prefix search on name/email", () => {
    assert.deepEqual(buildUserListFilter({ q: "Ad(min)" }), {
        $or: [
            { nameSearch: { $regex: "^ad\\(min\\)" } },
            { emailSearch: { $regex: "^ad\\(min\\)" } },
        ],
    });
});

test("user list sort is stable and deterministic", () => {
    assert.deepEqual(userListSort, { createdAt: -1, _id: -1 });
});
