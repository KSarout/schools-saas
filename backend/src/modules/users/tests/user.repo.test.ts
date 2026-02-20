import test from "node:test";
import assert from "node:assert/strict";

import { UserModel } from "../model/user.model";
import {
    countUsersForTenant,
    createUserForTenant,
    findActiveUserByEmail,
    listUsersForTenant,
    findUserByRole,
} from "../service/user.repo";

test("user repo scopes active-email lookup by tenant option", () => {
    const originalFindOne = UserModel.findOne;
    let seenFilter: unknown;
    let seenOpts: unknown;

    (UserModel as any).findOne = (filter: unknown) => {
        seenFilter = filter;
        return {
            setOptions(opts: unknown) {
                seenOpts = opts;
                return this;
            },
        };
    };

    try {
        findActiveUserByEmail("tenant-X", "admin@school.test");
        assert.deepEqual(seenFilter, {
            email: "admin@school.test",
            isActive: true,
        });
        assert.deepEqual(seenOpts, { tenantId: "tenant-X" });
    } finally {
        (UserModel as any).findOne = originalFindOne;
    }
});

test("user repo scopes role lookup by tenant option", () => {
    const originalFindOne = UserModel.findOne;
    let seenFilter: unknown;
    let seenOpts: unknown;

    (UserModel as any).findOne = (filter: unknown) => {
        seenFilter = filter;
        return {
            setOptions(opts: unknown) {
                seenOpts = opts;
                return this;
            },
        };
    };

    try {
        findUserByRole("tenant-Y", "SCHOOL_ADMIN");
        assert.deepEqual(seenFilter, { role: "SCHOOL_ADMIN" });
        assert.deepEqual(seenOpts, { tenantId: "tenant-Y" });
    } finally {
        (UserModel as any).findOne = originalFindOne;
    }
});

test("user repo create always writes caller tenantId", async () => {
    const originalCreate = UserModel.create;
    let createdDoc: unknown;

    (UserModel as any).create = async (doc: unknown) => {
        createdDoc = doc;
        return doc;
    };

    try {
        await createUserForTenant("tenant-Z", {
            name: "School Admin",
            email: "admin@school.test",
            role: "SCHOOL_ADMIN",
            passwordHash: "hash",
            mustChangePassword: true,
            isActive: true,
            tenantId: "evil-tenant",
        } as any);

        assert.equal((createdDoc as any).tenantId, "tenant-Z");
    } finally {
        (UserModel as any).create = originalCreate;
    }
});

test("user repo list applies tenant option", () => {
    const originalFind = UserModel.find;
    let seenFilter: unknown;
    let seenOpts: unknown;

    (UserModel as any).find = (filter: unknown) => {
        seenFilter = filter;
        return {
            setOptions(opts: unknown) {
                seenOpts = opts;
                return this;
            },
        };
    };

    try {
        listUsersForTenant("tenant-A", { role: "TEACHER", isActive: true });
        assert.deepEqual(seenFilter, { role: "TEACHER", isActive: true });
        assert.deepEqual(seenOpts, { tenantId: "tenant-A" });
    } finally {
        (UserModel as any).find = originalFind;
    }
});

test("user repo count applies tenant option", () => {
    const originalCount = UserModel.countDocuments;
    let seenFilter: unknown;
    let seenOpts: unknown;

    (UserModel as any).countDocuments = (filter: unknown) => {
        seenFilter = filter;
        return {
            setOptions(opts: unknown) {
                seenOpts = opts;
                return this;
            },
        };
    };

    try {
        countUsersForTenant("tenant-B", { isActive: false });
        assert.deepEqual(seenFilter, { isActive: false });
        assert.deepEqual(seenOpts, { tenantId: "tenant-B" });
    } finally {
        (UserModel as any).countDocuments = originalCount;
    }
});
