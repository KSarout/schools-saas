import mongoose, { type ClientSession, type Types } from "mongoose";
import { buildListResponse, type ListResponse } from "../../core/listResponse";
import { escapeRegex } from "../../core/regex";
import {
    toAcademicYearDto,
    type AcademicYearDto,
    type CreateAcademicYearInput,
    type UpdateAcademicYearInput,
} from "./academic-year.dto";
import { AcademicYearModel } from "./academic-year.model";

type TenantId = Types.ObjectId | string;

type AcademicYearListFilters = {
    q?: string;
    status?: "ACTIVE" | "INACTIVE";
    isActive?: boolean;
    current?: boolean;
};

function normalizeTenantId(tenantId: TenantId) {
    return String(tenantId);
}

function buildAcademicYearFilter(filters: AcademicYearListFilters) {
    const query: Record<string, unknown> = {};

    if (typeof filters.isActive === "boolean") query.isActive = filters.isActive;
    else if (filters.status === "ACTIVE") query.isActive = true;
    else if (filters.status === "INACTIVE") query.isActive = false;
    if (typeof filters.current === "boolean") query.isCurrent = filters.current;

    const q = filters.q?.trim().toLowerCase();
    if (q) {
        const safe = escapeRegex(q);
        query.$or = [{ nameSearch: { $regex: safe, $options: "i" } }, { codeSearch: { $regex: safe, $options: "i" } }];
    }

    return query;
}

function conflictError(message: string) {
    const err = new Error(message);
    (err as any).status = 409;
    return err;
}

function notFoundError() {
    const err = new Error("Academic year not found");
    (err as any).status = 404;
    return err;
}

async function runInTransaction<T>(work: (session: ClientSession) => Promise<T>) {
    const session = await mongoose.startSession();
    try {
        let result: T | undefined;
        await session.withTransaction(async () => {
            result = await work(session);
        });

        if (result === undefined) {
            throw new Error("Transaction failed");
        }

        return result;
    } finally {
        await session.endSession();
    }
}

async function setCurrentAcademicYearWithinTransaction(
    tenantId: TenantId,
    academicYearId: string,
    session: ClientSession
): Promise<AcademicYearDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);

    await AcademicYearModel.updateMany(
        { _id: { $ne: academicYearId }, isCurrent: true },
        { $set: { isCurrent: false } },
        { session }
    ).setOptions({ tenantId: normalizedTenantId });

    const updated = await AcademicYearModel.findOneAndUpdate(
        { _id: academicYearId },
        { $set: { isCurrent: true, isActive: true } },
        { new: true, session }
    ).setOptions({ tenantId: normalizedTenantId });

    if (!updated) throw notFoundError();
    return toAcademicYearDto(updated);
}

export async function listAcademicYears(
    tenantId: TenantId,
    filters: AcademicYearListFilters,
    page: number,
    limit: number
): Promise<ListResponse<AcademicYearDto>> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const filter = buildAcademicYearFilter(filters);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        AcademicYearModel.find(filter)
            .setOptions({ tenantId: normalizedTenantId })
            .sort({ startDate: -1, _id: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AcademicYearModel.countDocuments(filter).setOptions({ tenantId: normalizedTenantId }),
    ]);

    return buildListResponse({
        items: items.map(toAcademicYearDto),
        total,
        page,
        limit,
    });
}

export async function createAcademicYear(tenantId: TenantId, payload: CreateAcademicYearInput): Promise<AcademicYearDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const code = payload.code.trim().toUpperCase();

    const existing = await AcademicYearModel.findOne({ code }).setOptions({ tenantId: normalizedTenantId });
    if (existing) throw conflictError("Academic year code already exists");

    if (payload.isCurrent) {
        return runInTransaction(async (session) => {
            const [created] = await AcademicYearModel.create(
                [
                    {
                        tenantId: normalizedTenantId,
                        name: payload.name.trim(),
                        code,
                        startDate: payload.startDate,
                        endDate: payload.endDate,
                        isActive: payload.isActive,
                        isCurrent: false,
                    },
                ],
                { session }
            );
            if (!created) {
                throw new Error("Failed to create academic year");
            }

            return setCurrentAcademicYearWithinTransaction(normalizedTenantId, created._id.toString(), session);
        });
    }

    const created = await AcademicYearModel.create({
        tenantId: normalizedTenantId,
        name: payload.name.trim(),
        code,
        startDate: payload.startDate,
        endDate: payload.endDate,
        isActive: payload.isActive,
        isCurrent: false,
    });

    return toAcademicYearDto(created);
}

export async function getAcademicYearById(tenantId: TenantId, academicYearId: string): Promise<AcademicYearDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const year = await AcademicYearModel.findOne({ _id: academicYearId }).setOptions({ tenantId: normalizedTenantId });
    if (!year) throw notFoundError();
    return toAcademicYearDto(year);
}

export async function updateAcademicYear(
    tenantId: TenantId,
    academicYearId: string,
    patch: UpdateAcademicYearInput
): Promise<AcademicYearDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const year = await AcademicYearModel.findOne({ _id: academicYearId }).setOptions({ tenantId: normalizedTenantId });
    if (!year) throw notFoundError();

    if (patch.code !== undefined) {
        const code = patch.code.trim().toUpperCase();
        const existing = await AcademicYearModel.findOne({ code, _id: { $ne: academicYearId } }).setOptions({
            tenantId: normalizedTenantId,
        });
        if (existing) throw conflictError("Academic year code already exists");
        year.code = code;
    }

    if (patch.name !== undefined) year.name = patch.name.trim();
    if (patch.startDate !== undefined) year.startDate = patch.startDate;
    if (patch.endDate !== undefined) year.endDate = patch.endDate;
    if (patch.isActive !== undefined) year.isActive = patch.isActive;

    if (year.endDate <= year.startDate) {
        const err = new Error("endDate must be after startDate");
        (err as any).status = 400;
        throw err;
    }

    await year.save();

    if (patch.isCurrent === true) {
        return setCurrentAcademicYear(tenantId, academicYearId);
    }

    if (patch.isCurrent === false && year.isCurrent) {
        year.isCurrent = false;
        await year.save();
    }

    return toAcademicYearDto(year);
}

export async function setCurrentAcademicYear(tenantId: TenantId, academicYearId: string): Promise<AcademicYearDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    return runInTransaction((session) =>
        setCurrentAcademicYearWithinTransaction(normalizedTenantId, academicYearId, session)
    );
}

export async function deactivateAcademicYear(tenantId: TenantId, academicYearId: string) {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const updated = await AcademicYearModel.findOneAndUpdate(
        { _id: academicYearId },
        { $set: { isActive: false, isCurrent: false } },
        { new: true }
    ).setOptions({ tenantId: normalizedTenantId });

    if (!updated) throw notFoundError();

    return { ok: true as const };
}
