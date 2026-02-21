import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { AcademicYearModel } from "../academic-year.model";
import { listAcademicYears, setCurrentAcademicYear } from "../academic-year.service";

test("listAcademicYears returns enterprise list shape", async () => {
    const originalFind = AcademicYearModel.find;
    const originalCount = AcademicYearModel.countDocuments;

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
                _id: "ay1",
                name: "AY 2026/2027",
                code: "AY26-27",
                startDate: new Date("2026-08-01T00:00:00.000Z"),
                endDate: new Date("2027-07-31T00:00:00.000Z"),
                isActive: true,
                isCurrent: true,
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            },
        ],
    };

    (AcademicYearModel as any).find = () => chain;
    (AcademicYearModel as any).countDocuments = () => ({
        setOptions: async () => 1,
    });

    try {
        const result = await listAcademicYears("tenant-1", { current: true }, 1, 10);
        assert.equal(result.total, 1);
        assert.equal(result.page, 1);
        assert.equal(result.limit, 10);
        assert.equal(result.totalPages, 1);
        assert.equal(result.items[0]?.code, "AY26-27");
        assert.equal(result.items[0]?.isCurrent, true);
    } finally {
        (AcademicYearModel as any).find = originalFind;
        (AcademicYearModel as any).countDocuments = originalCount;
    }
});

test("setCurrentAcademicYear unsets previous current year in one transaction flow", async () => {
    const originalStartSession = mongoose.startSession;
    const originalUpdateMany = AcademicYearModel.updateMany;
    const originalFindOneAndUpdate = AcademicYearModel.findOneAndUpdate;

    let updateManyFilter: unknown;
    let updateManyOpts: unknown;
    let updateOneFilter: unknown;

    (mongoose as any).startSession = async () => ({
        async withTransaction(fn: () => Promise<void>) {
            await fn();
        },
        async endSession() {
            return undefined;
        },
    });

    (AcademicYearModel as any).updateMany = (filter: unknown, _update: unknown, opts: unknown) => {
        updateManyFilter = filter;
        return {
            setOptions(o: unknown) {
                updateManyOpts = o;
                return Promise.resolve({ acknowledged: true, modifiedCount: 1 });
            },
        };
    };

    (AcademicYearModel as any).findOneAndUpdate = (filter: unknown) => {
        updateOneFilter = filter;
        return {
            setOptions() {
                return Promise.resolve({
                    _id: "ay-current",
                    name: "AY 2026/2027",
                    code: "AY26-27",
                    startDate: new Date("2026-08-01T00:00:00.000Z"),
                    endDate: new Date("2027-07-31T00:00:00.000Z"),
                    isActive: true,
                    isCurrent: true,
                    createdAt: new Date("2026-01-01T00:00:00.000Z"),
                    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
                });
            },
        };
    };

    try {
        const updated = await setCurrentAcademicYear("tenant-1", "ay-current");
        assert.deepEqual(updateManyFilter, { _id: { $ne: "ay-current" }, isCurrent: true });
        assert.deepEqual(updateManyOpts, { tenantId: "tenant-1" });
        assert.deepEqual(updateOneFilter, { _id: "ay-current" });
        assert.equal(updated.isCurrent, true);
    } finally {
        (mongoose as any).startSession = originalStartSession;
        (AcademicYearModel as any).updateMany = originalUpdateMany;
        (AcademicYearModel as any).findOneAndUpdate = originalFindOneAndUpdate;
    }
});
