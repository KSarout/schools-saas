import test from "node:test";
import assert from "node:assert/strict";

import { AcademicYearModel } from "../../academic-years/academic-year.model";
import { SchoolClassModel } from "../../classes/class.model";
import { SectionModel } from "../../sections/section.model";
import { validateStudentPlacement } from "../service/studentPlacement";

test("validateStudentPlacement passes when class and section belong to academic year hierarchy", async () => {
    const originalYearFindOne = AcademicYearModel.findOne;
    const originalClassFindOne = SchoolClassModel.findOne;
    const originalSectionFindOne = SectionModel.findOne;

    (AcademicYearModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "ay-1" }),
    });
    (SchoolClassModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "class-1", academicYearId: "ay-1" }),
    });
    (SectionModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "section-1", classId: "class-1" }),
    });

    try {
        await validateStudentPlacement("tenant-1", {
            academicYearId: "507f1f77bcf86cd799439011",
            classId: "507f1f77bcf86cd799439012",
            sectionId: "507f1f77bcf86cd799439013",
        });
    } finally {
        (AcademicYearModel as any).findOne = originalYearFindOne;
        (SchoolClassModel as any).findOne = originalClassFindOne;
        (SectionModel as any).findOne = originalSectionFindOne;
    }
});

test("validateStudentPlacement rejects section without class", async () => {
    await assert.rejects(
        () =>
            validateStudentPlacement("tenant-1", {
                sectionId: "507f1f77bcf86cd799439013",
            }),
        (error: any) => error?.message === "classId is required when sectionId is provided"
    );
});

test("validateStudentPlacement rejects class/year mismatch", async () => {
    const originalYearFindOne = AcademicYearModel.findOne;
    const originalClassFindOne = SchoolClassModel.findOne;

    (AcademicYearModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "ay-1" }),
    });
    (SchoolClassModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "class-1", academicYearId: "ay-2" }),
    });

    try {
        await assert.rejects(
            () =>
                validateStudentPlacement("tenant-1", {
                    academicYearId: "507f1f77bcf86cd799439011",
                    classId: "507f1f77bcf86cd799439012",
                }),
            (error: any) => error?.message === "Class must belong to academic year"
        );
    } finally {
        (AcademicYearModel as any).findOne = originalYearFindOne;
        (SchoolClassModel as any).findOne = originalClassFindOne;
    }
});

test("validateStudentPlacement rejects section/class mismatch", async () => {
    const originalYearFindOne = AcademicYearModel.findOne;
    const originalClassFindOne = SchoolClassModel.findOne;
    const originalSectionFindOne = SectionModel.findOne;

    (AcademicYearModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "ay-1" }),
    });
    (SchoolClassModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "class-1", academicYearId: "ay-1" }),
    });
    (SectionModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "section-1", classId: "class-2" }),
    });

    try {
        await assert.rejects(
            () =>
                validateStudentPlacement("tenant-1", {
                    academicYearId: "507f1f77bcf86cd799439011",
                    classId: "507f1f77bcf86cd799439012",
                    sectionId: "507f1f77bcf86cd799439013",
                }),
            (error: any) => error?.message === "Section must belong to class"
        );
    } finally {
        (AcademicYearModel as any).findOne = originalYearFindOne;
        (SchoolClassModel as any).findOne = originalClassFindOne;
        (SectionModel as any).findOne = originalSectionFindOne;
    }
});
