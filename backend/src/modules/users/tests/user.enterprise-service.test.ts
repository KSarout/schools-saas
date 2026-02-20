import test from "node:test";
import assert from "node:assert/strict";

import * as repo from "../service/user.repo";
import * as password from "../../../utils/password";
import {
    createUserWithTempPassword,
    deactivateUser,
    listUsers,
    resetUserPassword,
    updateUser,
} from "../user.service";

test("enterprise service: createUserWithTempPassword hashes password and sets mustChangePassword=true", async () => {
    const originalFind = repo.findUserByEmail;
    const originalCreate = repo.createUserForTenant;
    const originalHash = password.hashPassword;

    let payloadSeen: any = null;
    (repo as any).findUserByEmail = async () => null;
    (password as any).hashPassword = async () => "hashed-temp";
    (repo as any).createUserForTenant = async (_tenantId: string, payload: any) => {
        payloadSeen = payload;
        return {
            _id: "u-enterprise-1",
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

        assert.equal(payloadSeen.mustChangePassword, true);
        assert.equal(payloadSeen.passwordHash, "hashed-temp");
        assert.equal(payloadSeen.email, "teacher@one.test");
        assert.equal(result.user.id, "u-enterprise-1");
        assert.ok(result.tempPassword.length >= 8);
    } finally {
        (repo as any).findUserByEmail = originalFind;
        (repo as any).createUserForTenant = originalCreate;
        (password as any).hashPassword = originalHash;
    }
});

test("enterprise service: listUsers returns enterprise list shape", async () => {
    const originalList = repo.listUsersForTenant;
    const originalCount = repo.countUsersForTenant;

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
                _id: "u-enterprise-2",
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

    (repo as any).listUsersForTenant = () => chain;
    (repo as any).countUsersForTenant = async () => 1;

    try {
        const list = await listUsers("tenant-1", { q: "a", status: "ACTIVE" }, 1, 10);
        assert.equal(list.total, 1);
        assert.equal(list.page, 1);
        assert.equal(list.limit, 10);
        assert.equal(list.totalPages, 1);
        assert.equal(list.items[0]?.id, "u-enterprise-2");
    } finally {
        (repo as any).listUsersForTenant = originalList;
        (repo as any).countUsersForTenant = originalCount;
    }
});

test("enterprise service: updateUser applies patch and returns dto", async () => {
    const originalFindById = repo.findUserById;
    let saved = false;
    const userDoc: any = {
        _id: "u-enterprise-3",
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
        const dto = await updateUser("tenant-1", "u-enterprise-3", {
            name: "New Name",
            role: "ACCOUNTANT",
            isActive: false,
        });
        assert.equal(saved, true);
        assert.equal(dto.name, "New Name");
        assert.equal(dto.role, "ACCOUNTANT");
        assert.equal(dto.isActive, false);
    } finally {
        (repo as any).findUserById = originalFindById;
    }
});

test("enterprise service: resetUserPassword returns tempPassword only and forces password change", async () => {
    const originalFindById = repo.findUserById;
    const originalHash = password.hashPassword;

    let saved = false;
    const userDoc: any = {
        _id: "u-enterprise-4",
        name: "User",
        email: "user@test.com",
        role: "TEACHER",
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
        const result = await resetUserPassword("tenant-1", "u-enterprise-4");
        assert.equal(userDoc.passwordHash, "new-hash");
        assert.equal(userDoc.mustChangePassword, true);
        assert.equal(saved, true);
        assert.deepEqual(Object.keys(result), ["tempPassword"]);
        assert.ok(result.tempPassword.length >= 8);
    } finally {
        (repo as any).findUserById = originalFindById;
        (password as any).hashPassword = originalHash;
    }
});

test("enterprise service: deactivateUser sets isActive=false and returns ok", async () => {
    const originalFindById = repo.findUserById;
    let saved = false;
    const userDoc: any = {
        _id: "u-enterprise-5",
        name: "User",
        email: "user2@test.com",
        role: "TEACHER",
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        async save() {
            saved = true;
        },
    };
    (repo as any).findUserById = async () => userDoc;

    try {
        const result = await deactivateUser("tenant-1", "u-enterprise-5");
        assert.equal(userDoc.isActive, false);
        assert.equal(saved, true);
        assert.deepEqual(result, { ok: true });
    } finally {
        (repo as any).findUserById = originalFindById;
    }
});
