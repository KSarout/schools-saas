import test from "node:test";
import assert from "node:assert/strict";

import {
    routePermissionMatrix,
    schoolPermissionMatrix,
    superAdminPermissionMatrix,
} from "./permissions";

test("route permission matrix only references declared permissions", () => {
    const school = new Set(Object.keys(schoolPermissionMatrix));
    const superAdmin = new Set(Object.keys(superAdminPermissionMatrix));

    for (const permission of Object.values(routePermissionMatrix)) {
        if (permission === null) continue;
        const exists = school.has(permission) || superAdmin.has(permission);
        assert.equal(exists, true, `Unknown permission: ${permission}`);
    }
});
