import test from "node:test";
import assert from "node:assert/strict";

import { StudentModel } from "../model/student.model";
import {
    createStudentForTenant,
    findStudentByIdForTenant,
    listStudentsForTenant,
} from "../service/student.repo";

test("student repo scopes list queries by tenant option", () => {
    const originalFind = StudentModel.find;
    let seenFilter: unknown;
    let seenOpts: unknown;

    (StudentModel as any).find = (filter: unknown) => {
        seenFilter = filter;
        return {
            setOptions(opts: unknown) {
                seenOpts = opts;
                return this;
            },
        };
    };

    try {
        listStudentsForTenant("tenant-A", { status: "ACTIVE" });
        assert.deepEqual(seenFilter, { status: "ACTIVE" });
        assert.deepEqual(seenOpts, { tenantId: "tenant-A" });
    } finally {
        (StudentModel as any).find = originalFind;
    }
});

test("student repo scopes findById queries by tenant option", () => {
    const originalFindOne = StudentModel.findOne;
    let seenFilter: unknown;
    let seenOpts: unknown;

    (StudentModel as any).findOne = (filter: unknown) => {
        seenFilter = filter;
        return {
            setOptions(opts: unknown) {
                seenOpts = opts;
                return this;
            },
        };
    };

    try {
        findStudentByIdForTenant("tenant-B", "student-1");
        assert.deepEqual(seenFilter, { _id: "student-1" });
        assert.deepEqual(seenOpts, { tenantId: "tenant-B" });
    } finally {
        (StudentModel as any).findOne = originalFindOne;
    }
});

test("student repo create always writes caller tenantId", async () => {
    const originalCreate = StudentModel.create;
    let createdDoc: unknown;

    (StudentModel as any).create = async (doc: unknown) => {
        createdDoc = doc;
        return doc;
    };

    try {
        await createStudentForTenant("tenant-C", {
            studentCode: "STU-2026-000001",
            studentId: "A-001",
            firstName: "Ada",
            lastName: "Lovelace",
            gender: "FEMALE",
            grade: "10",
            section: "A",
            status: "ACTIVE",
            tenantId: "evil-tenant",
        } as any);

        assert.equal((createdDoc as any).tenantId, "tenant-C");
    } finally {
        (StudentModel as any).create = originalCreate;
    }
});
