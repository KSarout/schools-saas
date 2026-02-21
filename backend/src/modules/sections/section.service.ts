import type { Types } from "mongoose";
import { buildListResponse, type ListResponse } from "../../core/listResponse";
import { escapeRegex } from "../../core/regex";
import { SchoolClassModel } from "../classes/class.model";
import { toSectionDto, type CreateSectionInput, type SectionDto, type UpdateSectionInput } from "./section.dto";
import { SectionModel } from "./section.model";

type TenantId = Types.ObjectId | string;

type SectionListFilters = {
    q?: string;
    classId?: string;
    status?: "ACTIVE" | "INACTIVE";
    isActive?: boolean;
};

function normalizeTenantId(tenantId: TenantId) {
    return String(tenantId);
}

function buildSectionFilter(filters: SectionListFilters) {
    const query: Record<string, unknown> = {};

    if (typeof filters.isActive === "boolean") query.isActive = filters.isActive;
    else if (filters.status === "ACTIVE") query.isActive = true;
    else if (filters.status === "INACTIVE") query.isActive = false;
    if (filters.classId) query.classId = filters.classId;

    const q = filters.q?.trim().toLowerCase();
    if (q) {
        const safe = escapeRegex(q);
        query.$or = [{ nameSearch: { $regex: safe, $options: "i" } }, { codeSearch: { $regex: safe, $options: "i" } }];
    }

    return query;
}

function notFoundError() {
    const err = new Error("Section not found");
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

async function ensureClassBelongsToTenant(tenantId: string, classId: string) {
    const schoolClass = await SchoolClassModel.findOne({ _id: classId }).setOptions({ tenantId });
    if (!schoolClass) throw badRequestError("Class not found");
}

export async function listSections(
    tenantId: TenantId,
    filters: SectionListFilters,
    page: number,
    limit: number
): Promise<ListResponse<SectionDto>> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const filter = buildSectionFilter(filters);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        SectionModel.find(filter)
            .setOptions({ tenantId: normalizedTenantId })
            .sort({ createdAt: -1, _id: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SectionModel.countDocuments(filter).setOptions({ tenantId: normalizedTenantId }),
    ]);

    return buildListResponse({
        items: items.map(toSectionDto),
        total,
        page,
        limit,
    });
}

export async function createSection(tenantId: TenantId, payload: CreateSectionInput): Promise<SectionDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const code = payload.code.trim().toUpperCase();

    await ensureClassBelongsToTenant(normalizedTenantId, payload.classId);

    const existing = await SectionModel.findOne({ classId: payload.classId, code }).setOptions({
        tenantId: normalizedTenantId,
    });
    if (existing) throw conflictError("Section code already exists for this class");

    const created = await SectionModel.create({
        tenantId: normalizedTenantId,
        name: payload.name.trim(),
        code,
        classId: payload.classId,
        capacity: payload.capacity,
        isActive: payload.isActive,
    });

    return toSectionDto(created);
}

export async function getSectionById(tenantId: TenantId, sectionId: string): Promise<SectionDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const section = await SectionModel.findOne({ _id: sectionId }).setOptions({ tenantId: normalizedTenantId });
    if (!section) throw notFoundError();
    return toSectionDto(section);
}

export async function updateSection(tenantId: TenantId, sectionId: string, patch: UpdateSectionInput): Promise<SectionDto> {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const section = await SectionModel.findOne({ _id: sectionId }).setOptions({ tenantId: normalizedTenantId });
    if (!section) throw notFoundError();

    if (patch.classId !== undefined) {
        await ensureClassBelongsToTenant(normalizedTenantId, patch.classId);
        section.classId = patch.classId as any;
    }

    if (patch.code !== undefined) {
        const nextCode = patch.code.trim().toUpperCase();
        const existing = await SectionModel.findOne({
            _id: { $ne: sectionId },
            classId: section.classId,
            code: nextCode,
        }).setOptions({ tenantId: normalizedTenantId });
        if (existing) throw conflictError("Section code already exists for this class");
        section.code = nextCode;
    }

    if (patch.name !== undefined) section.name = patch.name.trim();
    if (patch.capacity !== undefined) section.capacity = patch.capacity ?? undefined;
    if (patch.isActive !== undefined) section.isActive = patch.isActive;

    await section.save();

    return toSectionDto(section);
}

export async function deactivateSection(tenantId: TenantId, sectionId: string) {
    const normalizedTenantId = normalizeTenantId(tenantId);
    const updated = await SectionModel.findOneAndUpdate(
        { _id: sectionId },
        { $set: { isActive: false } },
        { new: true }
    ).setOptions({ tenantId: normalizedTenantId });

    if (!updated) throw notFoundError();

    return { ok: true as const };
}
