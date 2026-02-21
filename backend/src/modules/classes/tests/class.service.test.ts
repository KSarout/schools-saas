import test from "node:test";
import assert from "node:assert/strict";

import { AcademicYearModel } from "../../academic-years/academic-year.model";
import { UserModel } from "../../users/model/user.model";
import { SchoolClassModel } from "../class.model";
import { createClass, listClasses } from "../class.service";

test("createClass validates refs and returns mapped dto", async () => {
    const originalYearFindOne = AcademicYearModel.findOne;
    const originalUserFindOne = UserModel.findOne;
    const originalClassFindOne = SchoolClassModel.findOne;
    const originalCreate = SchoolClassModel.create;

    (AcademicYearModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "year-1" }),
    });
    (UserModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "teacher-1" }),
    });

    (SchoolClassModel as any).findOne = () => ({
        setOptions: async () => null,
    });

    (SchoolClassModel as any).create = async (doc: any) => ({
        _id: "class-1",
        ...doc,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    try {
        const dto = await createClass("tenant-1", {
            name: "Grade 10",
            code: "g10",
            level: "HIGH",
            academicYearId: "507f1f77bcf86cd799439011",
            homeroomTeacherId: "507f1f77bcf86cd799439012",
            isActive: true,
        });

        assert.equal(dto.id, "class-1");
        assert.equal(dto.code, "G10");
        assert.equal(dto.academicYearId, "507f1f77bcf86cd799439011");
    } finally {
        (AcademicYearModel as any).findOne = originalYearFindOne;
        (UserModel as any).findOne = originalUserFindOne;
        (SchoolClassModel as any).findOne = originalClassFindOne;
        (SchoolClassModel as any).create = originalCreate;
    }
});

test("listClasses returns enterprise list shape", async () => {
    const originalFind = SchoolClassModel.find;
    const originalCount = SchoolClassModel.countDocuments;

    const chain: any = {
        setOptions() {
            return this;
        },
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
                _id: "class-2",
                name: "Grade 11",
                code: "G11",
                level: "HIGH",
                academicYearId: "507f1f77bcf86cd799439011",
                isActive: true,
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            },
        ],
    };

    (SchoolClassModel as any).find = () => chain;
    (SchoolClassModel as any).countDocuments = () => ({ setOptions: async () => 1 });

    try {
        const result = await listClasses("tenant-1", {}, 1, 10);
        assert.equal(result.total, 1);
        assert.equal(result.totalPages, 1);
        assert.equal(result.items[0]?.code, "G11");
    } finally {
        (SchoolClassModel as any).find = originalFind;
        (SchoolClassModel as any).countDocuments = originalCount;
    }
});
