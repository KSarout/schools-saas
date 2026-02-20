import test from "node:test";
import assert from "node:assert/strict";

import * as repo from "../service/user.repo";
import * as password from "../../../utils/password";
import {
    createUserWithTempPassword,
    listUsers,
    resetUserPassword,
    updateUser,
} from "../service/user.service";

test("createUserWithTempPassword creates user with mustChangePassword=true", async () => {
    const originalFind = repo.findUserByEmail;
    const originalCreate = repo.createUserForTenant;
    const originalHash = password.hashPassword;

    let createdPayload: any;

    (repo as any).findUserByEmail = async () => null;
    (password as any).hashPassword = async () => "hashed-temp";
    (repo as any).createUserForTenant = async (_tenantId: string, payload: any) => {
        createdPayload = payload;
        return {
            _id: "u1",
            ...payload,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        };
    };

    try {
        const result = await createUserWithTempPassword("tenant-1", {
            name: "Teacher One",
            email: "Teacher@One.test",
            role: "TEACHER",
        });

        assert.equal(createdPayload.mustChangePassword, true);
        assert.equal(createdPayload.passwordHash, "hashed-temp");
        assert.equal(createdPayload.email, "teacher@one.test");
        assert.ok(result.tempPassword.length >= 6);
        assert.equal(result.user.role, "TEACHER");
    } finally {
        (repo as any).findUserByEmail = originalFind;
        (repo as any).createUserForTenant = originalCreate;
        (password as any).hashPassword = originalHash;
    }
});

test("resetUserPassword sets new hash and mustChangePassword=true", async () => {
    const originalFindById = repo.findUserById;
    const originalHash = password.hashPassword;

    let saved = false;
    const userDoc: any = {
        _id: "u2",
        name: "Admin",
        email: "admin@test.com",
        role: "SCHOOL_ADMIN",
        isActive: true,
        mustChangePassword: false,
        passwordHash: "old-hash",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        async save() {
            saved = true;
        },
    };

    (repo as any).findUserById = async () => userDoc;
    (password as any).hashPassword = async () => "new-hash";

    try {
        const result = await resetUserPassword("tenant-1", "u2");
        assert.equal(userDoc.passwordHash, "new-hash");
        assert.equal(userDoc.mustChangePassword, true);
        assert.equal(saved, true);
        assert.equal(result.user.id, "u2");
        assert.ok(result.tempPassword.length >= 6);
    } finally {
        (repo as any).findUserById = originalFindById;
        (password as any).hashPassword = originalHash;
    }
});

test("updateUser applies patch and returns dto", async () => {
    const originalFindById = repo.findUserById;
    let saved = false;

    const userDoc: any = {
        _id: "u3",
        name: "Old Name",
        email: "old@test.com",
        role: "TEACHER",
        isActive: true,
        mustChangePassword: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        async save() {
            saved = true;
        },
    };

    (repo as any).findUserById = async () => userDoc;

    try {
        const dto = await updateUser("tenant-1", "u3", {
            name: "New Name",
            role: "ACCOUNTANT",
            isActive: false,
        });

        assert.equal(saved, true);
        assert.equal(userDoc.name, "New Name");
        assert.equal(userDoc.role, "ACCOUNTANT");
        assert.equal(userDoc.isActive, false);
        assert.equal(dto.name, "New Name");
        assert.equal(dto.role, "ACCOUNTANT");
        assert.equal(dto.isActive, false);
    } finally {
        (repo as any).findUserById = originalFindById;
    }
});

test("listUsers returns enterprise list shape with mapped items", async () => {
    const originalList = repo.listUsersForTenant;
    const originalCount = repo.countUsersForTenant;
    let seenFilter: unknown;

    const chain: any = {
        sort() {
            return this;
        },
        skip() {
            return this;
        },
        limit() {
            return this;
        },
        lean: async () => [
            {
                _id: "u4",
                name: "A User",
                email: "a@test.com",
                role: "TEACHER",
                isActive: true,
                mustChangePassword: true,
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            },
        ],
    };

    (repo as any).listUsersForTenant = (_tenantId: string, filter: unknown) => {
        seenFilter = filter;
        return chain;
    };
    (repo as any).countUsersForTenant = async () => 1;

    try {
        const list = await listUsers("tenant-1", { q: "a", status: "ACTIVE" }, { page: 1, limit: 10 });
        assert.equal((seenFilter as any).isActive, true);
        assert.equal(list.total, 1);
        assert.equal(list.page, 1);
        assert.equal(list.limit, 10);
        assert.equal(list.totalPages, 1);
        assert.equal(list.items[0]?.id, "u4");
    } finally {
        (repo as any).listUsersForTenant = originalList;
        (repo as any).countUsersForTenant = originalCount;
    }
});
