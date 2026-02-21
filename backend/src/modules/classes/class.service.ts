import type { Types } from "mongoose";
import { buildListResponse, type ListResponse } from "../../core/listResponse";
import { escapeRegex } from "../../core/regex";
import { AcademicYearModel } from "../academic-years/academic-year.model";
import { UserModel } from "../users/model/user.model";
import { toClassDto, type CreateClassInput, type SchoolClassDto, type UpdateClassInput } from "./class.dto";
import { SchoolClassModel } from "./class.model";

type TenantId = Types.ObjectId | string;

type ClassListFilters = {
    q?: string;
    level?: string;
    status?: "ACTIVE" | "INACTIVE";
    isActive?: boolean;
    academicYearId?: string;
};

function normalizeTenantId(tenantId: TenantId) {
    return String(tenantId);
}

function buildClassFilter(filters: ClassListFilters) {
    const query: Record<string, unknown> = {};

    if (typeof filters.isActive === "boolean") query.isActive = filters.isActive;
    else if (filters.status === "ACTIVE") query.isActive = true;
    else if (filters.status === "INACTIVE") query.isActive = false;
    if (filters.level) query.level = filters.level;
    if (filters.academicYearId) query.academicYearId = filters.academicYearId;

    const q = filters.q?.trim().toLowerCase();
    if (q) {
        const safe = escapeRegex(q);
        query.$or = [{ nameSearch: { $regex: safe, $options: "i" } }, { codeSearch: { $regex: safe, $options: "i" } }];
    }

    return query;
}

function notFoundError() {
    const err = new Error("Class not found");
    (err as any).status = 404;
    return err;
}

function badRequestError(message: string) {
    const err = new Error(message);
    (err as any).status = 400;
    return err;
}

function conflictError(message: string) {
    const err = new Error(message);
    (err as any).status = 409;
    return err;
}

async function ensureAcademicYearBelongsToTenant(tenantId: string, academicYearId: string) {
    const year = await AcademicYearModel.findOne({ _id: academicYearId }).setOptions({ tenantId });
    if (!year) throw badRequestError("Academic year not found");
}

async function ensureHomeroomTeacherBelongsToTenant(tenantId: string, userId: string) {
    const user = await UserModel.findOne({ _id: userId, isActive: true }).setOptions({ tenantId });
    if (!user) throw badRequestError("Homeroom teacher not found");
}

export async function listClasses(
    tenantId: TenantId,
    filters: ClassListFilters,
    page: number,
    limit: number
): Promise<ListResponse<SchoolClassDto>> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const filter = buildClassFilter(filters);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        SchoolClassModel.find(filter)
            .setOptions({ tenantId: normalizedTenantId })
            .sort({ createdAt: -1, _id: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SchoolClassModel.countDocuments(filter).setOptions({ tenantId: normalizedTenantId }),
    ]);

    return buildListResponse({
        items: items.map(toClassDto),
        total,
        page,
        limit,
    });
}

export async function createClass(tenantId: TenantId, payload: CreateClassInput): Promise<SchoolClassDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const code = payload.code.trim().toUpperCase();

    await ensureAcademicYearBelongsToTenant(normalizedTenantId, payload.academicYearId);

    if (payload.homeroomTeacherId) {
        await ensureHomeroomTeacherBelongsToTenant(normalizedTenantId, payload.homeroomTeacherId);
    }

    const existing = await SchoolClassModel.findOne({
        academicYearId: payload.academicYearId,
        code,
    }).setOptions({ tenantId: normalizedTenantId });
    if (existing) throw conflictError("Class code already exists for this academic year");

    const created = await SchoolClassModel.create({
        tenantId: normalizedTenantId,
        name: payload.name.trim(),
        code,
        level: payload.level.trim(),
        capacity: payload.capacity,
        isActive: payload.isActive,
        academicYearId: payload.academicYearId,
        homeroomTeacherId: payload.homeroomTeacherId,
    });

    return toClassDto(created);
}

export async function getClassById(tenantId: TenantId, classId: string): Promise<SchoolClassDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const schoolClass = await SchoolClassModel.findOne({ _id: classId }).setOptions({ tenantId: normalizedTenantId });
    if (!schoolClass) throw notFoundError();
    return toClassDto(schoolClass);
}

export async function updateClass(tenantId: TenantId, classId: string, patch: UpdateClassInput): Promise<SchoolClassDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const schoolClass = await SchoolClassModel.findOne({ _id: classId }).setOptions({ tenantId: normalizedTenantId });
    if (!schoolClass) throw notFoundError();

    if (patch.academicYearId !== undefined) {
        await ensureAcademicYearBelongsToTenant(normalizedTenantId, patch.academicYearId);
        schoolClass.academicYearId = patch.academicYearId as any;
    }

    if (patch.homeroomTeacherId !== undefined) {
        if (patch.homeroomTeacherId === null) {
            schoolClass.homeroomTeacherId = undefined;
        } else {
            await ensureHomeroomTeacherBelongsToTenant(normalizedTenantId, patch.homeroomTeacherId);
            schoolClass.homeroomTeacherId = patch.homeroomTeacherId as any;
        }
    }

    if (patch.code !== undefined) {
        const nextCode = patch.code.trim().toUpperCase();
        const existing = await SchoolClassModel.findOne({
            _id: { $ne: classId },
            academicYearId: schoolClass.academicYearId,
            code: nextCode,
        }).setOptions({ tenantId: normalizedTenantId });
        if (existing) throw conflictError("Class code already exists for this academic year");
        schoolClass.code = nextCode;
    }

    if (patch.name !== undefined) schoolClass.name = patch.name.trim();
    if (patch.level !== undefined) schoolClass.level = patch.level.trim();
    if (patch.capacity !== undefined) schoolClass.capacity = patch.capacity ?? undefined;
    if (patch.isActive !== undefined) schoolClass.isActive = patch.isActive;

    await schoolClass.save();

    return toClassDto(schoolClass);
}

export async function deactivateClass(tenantId: TenantId, classId: string) {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const updated = await SchoolClassModel.findOneAndUpdate(
        { _id: classId },
        { $set: { isActive: false } },
        { new: true }
    ).setOptions({ tenantId: normalizedTenantId });

    if (!updated) throw notFoundError();

    return { ok: true as const };
}
