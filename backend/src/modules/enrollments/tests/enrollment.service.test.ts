import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { AcademicYearModel } from "../../academic-years/academic-year.model";
import { SchoolClassModel } from "../../classes/class.model";
import { SectionModel } from "../../sections/section.model";
import { StudentModel } from "../../students/model/student.model";
import { UserModel } from "../../users/model/user.model";
import { EnrollmentModel } from "../model/enrollment.model";
import { EnrollmentAuditLogModel } from "../model/enrollmentAudit.model";
import {
    createEnrollment,
    promoteStudentEnrollment,
    transferStudentEnrollment,
    transitionEnrollment,
    withdrawStudentEnrollment,
} from "../service/enrollment.service";

test("createEnrollment creates active enrollment with validated refs", async () => {
    const originalStudentFind = StudentModel.findOne;
    const originalYearFind = AcademicYearModel.findOne;
    const originalClassFind = SchoolClassModel.findOne;
    const originalSectionFind = SectionModel.findOne;
    const originalUserFind = UserModel.findOne;
    const originalEnrollmentFind = EnrollmentModel.findOne;
    const originalEnrollmentCreate = EnrollmentModel.create;
    const originalAuditCreate = EnrollmentAuditLogModel.create;

    (StudentModel as any).findOne = () => ({ setOptions: async () => ({ _id: "stu-1" }) });
    (AcademicYearModel as any).findOne = () => ({ setOptions: async () => ({ _id: "year-1" }) });
    (SchoolClassModel as any).findOne = () => ({ setOptions: async () => ({ _id: "class-1", academicYearId: "year-1" }) });
    (SectionModel as any).findOne = () => ({ setOptions: async () => ({ _id: "section-1", classId: "class-1" }) });
    (UserModel as any).findOne = () => ({ setOptions: async () => ({ _id: "actor-1" }) });
    (EnrollmentModel as any).findOne = () => ({ setOptions: async () => null });

    (EnrollmentModel as any).create = async (doc: any) => ({
        _id: "enroll-1",
        ...doc,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    (EnrollmentAuditLogModel as any).create = async (docs: any[]) => [{ _id: "audit-0", ...docs[0] }];

    try {
        const created = await createEnrollment("507f1f77bcf86cd799439099", {
            studentId: "507f1f77bcf86cd799439001",
            academicYearId: "507f1f77bcf86cd799439002",
            classId: "507f1f77bcf86cd799439003",
            sectionId: "507f1f77bcf86cd799439004",
            startDate: new Date("2026-08-01T00:00:00.000Z"),
            createdBy: "507f1f77bcf86cd799439005",
        });

        assert.equal(created.id, "enroll-1");
        assert.equal(created.status, "ACTIVE");
    } finally {
        (StudentModel as any).findOne = originalStudentFind;
        (AcademicYearModel as any).findOne = originalYearFind;
        (SchoolClassModel as any).findOne = originalClassFind;
        (SectionModel as any).findOne = originalSectionFind;
        (UserModel as any).findOne = originalUserFind;
        (EnrollmentModel as any).findOne = originalEnrollmentFind;
        (EnrollmentModel as any).create = originalEnrollmentCreate;
        (EnrollmentAuditLogModel as any).create = originalAuditCreate;
    }
});

test("createEnrollment writes enrollment audit log with ASSIGN action", async () => {
    const originalStudentFind = StudentModel.findOne;
    const originalYearFind = AcademicYearModel.findOne;
    const originalClassFind = SchoolClassModel.findOne;
    const originalSectionFind = SectionModel.findOne;
    const originalUserFind = UserModel.findOne;
    const originalEnrollmentFind = EnrollmentModel.findOne;
    const originalEnrollmentCreate = EnrollmentModel.create;
    const originalAuditCreate = EnrollmentAuditLogModel.create;

    let seenAction = "";
    let seenStudentId = "";

    (StudentModel as any).findOne = () => ({ setOptions: async () => ({ _id: "stu-1" }) });
    (AcademicYearModel as any).findOne = () => ({ setOptions: async () => ({ _id: "year-1" }) });
    (SchoolClassModel as any).findOne = () => ({ setOptions: async () => ({ _id: "class-1", academicYearId: "year-1" }) });
    (SectionModel as any).findOne = () => ({ setOptions: async () => ({ _id: "section-1", classId: "class-1" }) });
    (UserModel as any).findOne = () => ({ setOptions: async () => ({ _id: "actor-1" }) });
    (EnrollmentModel as any).findOne = () => ({ setOptions: async () => null });

    (EnrollmentModel as any).create = async (doc: any) => ({
        _id: "enroll-2",
        ...doc,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    (EnrollmentAuditLogModel as any).create = async (docs: any[]) => {
        seenAction = String(docs[0]?.action ?? "");
        seenStudentId = String(docs[0]?.studentId ?? "");
        return [{ _id: "audit-1", ...docs[0] }];
    };

    try {
        await createEnrollment("507f1f77bcf86cd799439099", {
            studentId: "507f1f77bcf86cd799439001",
            academicYearId: "507f1f77bcf86cd799439002",
            classId: "507f1f77bcf86cd799439003",
            sectionId: "507f1f77bcf86cd799439004",
            startDate: new Date("2026-08-01T00:00:00.000Z"),
            createdBy: "507f1f77bcf86cd799439005",
        });

        assert.equal(seenAction, "ASSIGN");
        assert.equal(seenStudentId, "507f1f77bcf86cd799439001");
    } finally {
        (StudentModel as any).findOne = originalStudentFind;
        (AcademicYearModel as any).findOne = originalYearFind;
        (SchoolClassModel as any).findOne = originalClassFind;
        (SectionModel as any).findOne = originalSectionFind;
        (UserModel as any).findOne = originalUserFind;
        (EnrollmentModel as any).findOne = originalEnrollmentFind;
        (EnrollmentModel as any).create = originalEnrollmentCreate;
        (EnrollmentAuditLogModel as any).create = originalAuditCreate;
    }
});

test("transitionEnrollment closes current enrollment and creates next active enrollment", async () => {
    const originalStartSession = mongoose.startSession;
    const originalStudentFind = StudentModel.findOne;
    const originalYearFind = AcademicYearModel.findOne;
    const originalClassFind = SchoolClassModel.findOne;
    const originalSectionFind = SectionModel.findOne;
    const originalUserFind = UserModel.findOne;
    const originalEnrollmentFind = EnrollmentModel.findOne;
    const originalEnrollmentCreate = EnrollmentModel.create;
    const originalAuditCreate = EnrollmentAuditLogModel.create;

    let savedCurrent = false;
    const currentDoc: any = {
        _id: "enroll-current",
        studentId: "stu-1",
        academicYearId: "507f1f77bcf86cd799439022",
        classId: "507f1f77bcf86cd799439033",
        sectionId: "507f1f77bcf86cd799439044",
        status: "ACTIVE",
        startDate: new Date("2026-08-01T00:00:00.000Z"),
        createdBy: "actor-old",
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        updatedAt: new Date("2026-08-01T00:00:00.000Z"),
        async save() {
            savedCurrent = true;
        },
    };

    (mongoose as any).startSession = async () => ({
        async withTransaction(fn: () => Promise<void>) {
            await fn();
        },
        async endSession() {
            return undefined;
        },
    });

    (StudentModel as any).findOne = () => ({ setOptions: async () => ({ _id: "stu-1" }) });
    (AcademicYearModel as any).findOne = () => ({ setOptions: async () => ({ _id: "year-2" }) });
    (SchoolClassModel as any).findOne = () => ({ setOptions: async () => ({ _id: "class-2", academicYearId: "year-2" }) });
    (SectionModel as any).findOne = () => ({ setOptions: async () => ({ _id: "section-2", classId: "class-2" }) });
    (UserModel as any).findOne = () => ({ setOptions: async () => ({ _id: "actor-1" }) });

    (EnrollmentModel as any).findOne = () => ({
        sort() {
            return this;
        },
        setOptions() {
            return this;
        },
        session() {
            return Promise.resolve(currentDoc);
        },
    });

    (EnrollmentModel as any).create = async (docs: any[]) => [
        {
            _id: "enroll-next",
            ...docs[0],
            createdAt: new Date("2027-01-01T00:00:00.000Z"),
            updatedAt: new Date("2027-01-01T00:00:00.000Z"),
        },
    ];
    (EnrollmentAuditLogModel as any).create = async (docs: any[]) => [{ _id: "audit-2", ...docs[0] }];

    try {
        const result = await transitionEnrollment("507f1f77bcf86cd799439099", {
            studentId: "507f1f77bcf86cd799439001",
            academicYearId: "507f1f77bcf86cd799439022",
            classId: "507f1f77bcf86cd799439033",
            sectionId: "507f1f77bcf86cd799439044",
            startDate: new Date("2027-01-01T00:00:00.000Z"),
            actorUserId: "507f1f77bcf86cd799439055",
            previousStatus: "PROMOTED",
        });

        assert.equal(savedCurrent, true);
        assert.equal(result.previousEnrollment.status, "PROMOTED");
        assert.equal(result.currentEnrollment.status, "ACTIVE");
        assert.equal(result.currentEnrollment.id, "enroll-next");
    } finally {
        (mongoose as any).startSession = originalStartSession;
        (StudentModel as any).findOne = originalStudentFind;
        (AcademicYearModel as any).findOne = originalYearFind;
        (SchoolClassModel as any).findOne = originalClassFind;
        (SectionModel as any).findOne = originalSectionFind;
        (UserModel as any).findOne = originalUserFind;
        (EnrollmentModel as any).findOne = originalEnrollmentFind;
        (EnrollmentModel as any).create = originalEnrollmentCreate;
        (EnrollmentAuditLogModel as any).create = originalAuditCreate;
    }
});

test("transferStudentEnrollment rejects when no active enrollment exists", async () => {
    const tenantId = "507f1f77bcf86cd7994390aa";
    const originalUserFind = UserModel.findOne;
    const originalEnrollmentFind = EnrollmentModel.findOne;

    (UserModel as any).findOne = () => ({ setOptions: async () => ({ _id: "actor-1" }) });
    (EnrollmentModel as any).findOne = () => ({ setOptions: async () => null });

    try {
        await assert.rejects(
            transferStudentEnrollment(tenantId, {
                studentId: "507f1f77bcf86cd799439001",
                academicYearId: "507f1f77bcf86cd799439002",
                toClassId: "507f1f77bcf86cd799439003",
                toSectionId: "507f1f77bcf86cd799439004",
                effectiveDate: new Date("2026-08-01T00:00:00.000Z"),
                actorUserId: "507f1f77bcf86cd799439005",
            }),
            (error: any) => error?.status === 404 && String(error?.message).includes("Active enrollment not found")
        );
    } finally {
        (UserModel as any).findOne = originalUserFind;
        (EnrollmentModel as any).findOne = originalEnrollmentFind;
    }
});

test("transferStudentEnrollment rejects transfer to the same class/section", async () => {
    const tenantId = "507f1f77bcf86cd7994390ab";
    const originalStartSession = mongoose.startSession;
    const originalStudentFind = StudentModel.findOne;
    const originalYearFind = AcademicYearModel.findOne;
    const originalClassFind = SchoolClassModel.findOne;
    const originalSectionFind = SectionModel.findOne;
    const originalUserFind = UserModel.findOne;
    const originalEnrollmentFind = EnrollmentModel.findOne;

    const currentDoc: any = {
        _id: "enroll-current",
        studentId: "stu-1",
        academicYearId: "year-1",
        classId: "507f1f77bcf86cd799439003",
        sectionId: "507f1f77bcf86cd799439004",
        status: "ACTIVE",
        startDate: new Date("2026-08-01T00:00:00.000Z"),
        async save() {
            return undefined;
        },
    };

    (mongoose as any).startSession = async () => ({
        async withTransaction(fn: () => Promise<void>) {
            await fn();
        },
        async endSession() {
            return undefined;
        },
    });

    (StudentModel as any).findOne = () => ({ setOptions: async () => ({ _id: "stu-1" }) });
    (AcademicYearModel as any).findOne = () => ({ setOptions: async () => ({ _id: "year-1" }) });
    (SchoolClassModel as any).findOne = () => ({ setOptions: async () => ({ _id: "class-1", academicYearId: "year-1" }) });
    (SectionModel as any).findOne = () => ({ setOptions: async () => ({ _id: "section-1", classId: "class-1" }) });
    (UserModel as any).findOne = () => ({ setOptions: async () => ({ _id: "actor-1" }) });

    let findCount = 0;
    (EnrollmentModel as any).findOne = () => {
        findCount += 1;
        if (findCount === 1) {
            return { setOptions: async () => currentDoc };
        }
        return {
            setOptions() {
                return this;
            },
            session() {
                return Promise.resolve(currentDoc);
            },
        };
    };

    try {
        await assert.rejects(
            transferStudentEnrollment(tenantId, {
                studentId: "507f1f77bcf86cd799439001",
                academicYearId: "507f1f77bcf86cd799439002",
                toClassId: "507f1f77bcf86cd799439003",
                toSectionId: "507f1f77bcf86cd799439004",
                effectiveDate: new Date("2026-09-01T00:00:00.000Z"),
                actorUserId: "507f1f77bcf86cd799439005",
            }),
            (error: any) =>
                error?.status === 400 &&
                String(error?.message).includes("Transfer target must be different from current class/section")
        );
    } finally {
        (mongoose as any).startSession = originalStartSession;
        (StudentModel as any).findOne = originalStudentFind;
        (AcademicYearModel as any).findOne = originalYearFind;
        (SchoolClassModel as any).findOne = originalClassFind;
        (SectionModel as any).findOne = originalSectionFind;
        (UserModel as any).findOne = originalUserFind;
        (EnrollmentModel as any).findOne = originalEnrollmentFind;
    }
});

test("promoteStudentEnrollment rejects same from and to academic year", async () => {
    const tenantId = "507f1f77bcf86cd7994390ac";
    await assert.rejects(
        promoteStudentEnrollment(tenantId, {
            studentId: "507f1f77bcf86cd799439001",
            fromAcademicYearId: "507f1f77bcf86cd799439002",
            toAcademicYearId: "507f1f77bcf86cd799439002",
            toClassId: "507f1f77bcf86cd799439003",
            toSectionId: "507f1f77bcf86cd799439004",
            effectiveDate: new Date("2026-09-01T00:00:00.000Z"),
            actorUserId: "507f1f77bcf86cd799439005",
        }),
        (error: any) =>
            error?.status === 400 && String(error?.message).includes("toAcademicYearId must be different")
    );
});

test("withdrawStudentEnrollment rejects effectiveDate before current enrollment startDate", async () => {
    const tenantId = "507f1f77bcf86cd7994390ad";
    const originalUserFind = UserModel.findOne;
    const originalEnrollmentFind = EnrollmentModel.findOne;

    const currentDoc: any = {
        _id: "enroll-current",
        studentId: "stu-1",
        academicYearId: "year-1",
        classId: "class-1",
        sectionId: "section-1",
        status: "ACTIVE",
        startDate: new Date("2026-09-01T00:00:00.000Z"),
        async save() {
            return undefined;
        },
    };

    (UserModel as any).findOne = () => ({ setOptions: async () => ({ _id: "actor-1" }) });
    (EnrollmentModel as any).findOne = () => ({ setOptions: async () => currentDoc });

    try {
        await assert.rejects(
            withdrawStudentEnrollment(tenantId, {
                studentId: "507f1f77bcf86cd799439001",
                academicYearId: "507f1f77bcf86cd799439002",
                effectiveDate: new Date("2026-08-01T00:00:00.000Z"),
                actorUserId: "507f1f77bcf86cd799439005",
            }),
            (error: any) =>
                error?.status === 400 &&
                String(error?.message).includes("effectiveDate cannot be before current enrollment startDate")
        );
    } finally {
        (UserModel as any).findOne = originalUserFind;
        (EnrollmentModel as any).findOne = originalEnrollmentFind;
    }
});
