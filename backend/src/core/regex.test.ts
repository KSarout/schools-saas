import test from "node:test";
import assert from "node:assert/strict";

import { escapeRegex } from "./regex";

test("escapeRegex escapes regex metacharacters", () => {
    assert.equal(
        escapeRegex("sch(ool)+.*"),
        "sch\\(ool\\)\\+\\.\\*",
    );
});

test("escapeRegex leaves plain text unchanged", () => {
    assert.equal(escapeRegex("tenant-abc"), "tenant-abc");
});
