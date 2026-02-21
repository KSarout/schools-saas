import test from "node:test";
import assert from "node:assert/strict";

import { SchoolClassModel } from "../../classes/class.model";
import { SectionModel } from "../section.model";
import { createSection, listSections } from "../section.service";

test("createSection validates class and maps dto", async () => {
    const originalClassFindOne = SchoolClassModel.findOne;
    const originalSectionFindOne = SectionModel.findOne;
    const originalCreate = SectionModel.create;

    (SchoolClassModel as any).findOne = () => ({
        setOptions: async () => ({ _id: "class-1" }),
    });

    (SectionModel as any).findOne = () => ({
        setOptions: async () => null,
    });

    (SectionModel as any).create = async (doc: any) => ({
        _id: "section-1",
        ...doc,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    try {
        const dto = await createSection("tenant-1", {
            name: "A",
            code: "a",
            classId: "507f1f77bcf86cd799439011",
            isActive: true,
        });

        assert.equal(dto.id, "section-1");
        assert.equal(dto.code, "A");
        assert.equal(dto.classId, "507f1f77bcf86cd799439011");
    } finally {
        (SchoolClassModel as any).findOne = originalClassFindOne;
        (SectionModel as any).findOne = originalSectionFindOne;
        (SectionModel as any).create = originalCreate;
    }
});

test("listSections returns enterprise list response", async () => {
    const originalFind = SectionModel.find;
    const originalCount = SectionModel.countDocuments;

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
                _id: "section-2",
                name: "B",
                code: "B",
                classId: "507f1f77bcf86cd799439011",
                isActive: true,
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            },
        ],
    };

    (SectionModel as any).find = () => chain;
    (SectionModel as any).countDocuments = () => ({ setOptions: async () => 1 });

    try {
        const result = await listSections("tenant-1", {}, 1, 10);
        assert.equal(result.total, 1);
        assert.equal(result.page, 1);
        assert.equal(result.limit, 10);
        assert.equal(result.items[0]?.code, "B");
    } finally {
        (SectionModel as any).find = originalFind;
        (SectionModel as any).countDocuments = originalCount;
    }
});
