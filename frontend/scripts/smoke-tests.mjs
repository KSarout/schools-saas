import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

function read(relPath) {
    const fullPath = join(process.cwd(), relPath);
    return readFileSync(fullPath, "utf8");
}

function expectIncludes(content, needle, message) {
    assert.ok(content.includes(needle), message);
}

function expectNotIncludes(content, needle, message) {
    assert.ok(!content.includes(needle), message);
}

function run() {
    const dashboardLayout = read("src/app/[locale]/(app)/school/(protected)/dashboard/layout.tsx");
    expectIncludes(
        dashboardLayout,
        "return children;",
        "dashboard layout must be pass-through to avoid nested sidebar shells"
    );
    expectNotIncludes(
        dashboardLayout,
        "SchoolSidebar",
        "dashboard layout must not render SchoolSidebar directly"
    );

    const settingsLayout = read("src/app/[locale]/(app)/school/(protected)/settings/layout.tsx");
    expectIncludes(
        settingsLayout,
        "return children;",
        "settings layout must be pass-through to avoid duplicate shells"
    );
    expectNotIncludes(
        settingsLayout,
        "SchoolSidebar",
        "settings layout must not render SchoolSidebar directly"
    );

    const enrollmentTable = read("src/features/enrollment/components/EnrollmentTable.tsx");
    expectIncludes(
        enrollmentTable,
        "Read only",
        "enrollment table must show read-only state for non-manage roles"
    );
    expectIncludes(
        enrollmentTable,
        "canManage ?",
        "enrollment actions must remain role-gated in UI"
    );

    const studentForm = read("src/features/students/components/StudentFormDialog.tsx");
    expectIncludes(
        studentForm,
        "Academic Year, Class, and Section are required before saving.",
        "student form must communicate strict placement requirement"
    );
    expectIncludes(
        studentForm,
        "Optional: leave blank to auto-use generated STU code",
        "student ID field must remain optional and clear to users"
    );

    console.log("frontend smoke tests passed");
}

run();
