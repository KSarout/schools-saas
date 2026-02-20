import test from "node:test";
import assert from "node:assert/strict";
import { buildStudentListFilter, studentListSort } from "../service/student.search";

test("buildStudentListFilter defaults to active status", () => {
    assert.deepEqual(buildStudentListFilter({}), {
        status: "ACTIVE",
    });
});

test("buildStudentListFilter uses escaped prefix query fields", () => {
    const filter = buildStudentListFilter({ q: "Jo(n)" });
    assert.deepEqual(filter, {
        status: "ACTIVE",
        $or: [
            { studentCodeSearch: { $regex: "^jo\\(n\\)" } },
            { studentIdSearch: { $regex: "^jo\\(n\\)" } },
            { firstNameSearch: { $regex: "^jo\\(n\\)" } },
            { lastNameSearch: { $regex: "^jo\\(n\\)" } },
            { parentPhoneSearch: { $regex: "^jo\\(n\\)" } },
        ],
    });
});

test("buildStudentListFilter narrows STU code searches to code field", () => {
    assert.deepEqual(buildStudentListFilter({ q: "STU-2026" }), {
        status: "ACTIVE",
        $or: [{ studentCodeSearch: { $regex: "^stu-2026" } }],
    });
});

test("student list sort is stable and deterministic", () => {
    assert.deepEqual(studentListSort, { createdAt: -1, _id: -1 });
});
