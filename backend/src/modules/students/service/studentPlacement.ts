import type { Types } from "mongoose";
import { AcademicYearModel } from "../../academic-years/academic-year.model";
import { SchoolClassModel } from "../../classes/class.model";
import { SectionModel } from "../../sections/section.model";

type TenantId = Types.ObjectId | string;

export type StudentPlacement = {
    academicYearId?: string | null;
    classId?: string | null;
    sectionId?: string | null;
};

function badRequestError(message: string) {
    const err = new Error(message);
    (err as any).status = 400;
    return err;
}

function normalizeTenantId(tenantId: TenantId) {
    return String(tenantId);
}

export async function validateStudentPlacement(tenantId: TenantId, placement: StudentPlacement) {
    const normalizedTenantId = normalizeTenantId(tenantId);

    const academicYearId = placement.academicYearId ?? undefined;
    const classId = placement.classId ?? undefined;
    const sectionId = placement.sectionId ?? undefined;

    if (sectionId && !classId) {
        throw badRequestError("classId is required when sectionId is provided");
    }

    if (classId && !academicYearId) {
        throw badRequestError("academicYearId is required when classId is provided");
    }

    const [yearDoc, classDoc, sectionDoc] = await Promise.all([
        academicYearId
            ? AcademicYearModel.findOne({ _id: academicYearId }).setOptions({ tenantId: normalizedTenantId })
            : Promise.resolve(null),
        classId ? SchoolClassModel.findOne({ _id: classId }).setOptions({ tenantId: normalizedTenantId }) : Promise.resolve(null),
        sectionId ? SectionModel.findOne({ _id: sectionId }).setOptions({ tenantId: normalizedTenantId }) : Promise.resolve(null),
    ]);

    if (academicYearId && !yearDoc) {
        throw badRequestError("Academic year not found");
    }

    if (classId && !classDoc) {
        throw badRequestError("Class not found");
    }

    if (sectionId && !sectionDoc) {
        throw badRequestError("Section not found");
    }

    if (classDoc && yearDoc && String(classDoc.academicYearId) !== String(yearDoc._id)) {
        throw badRequestError("Class must belong to academic year");
    }

    if (sectionDoc && classDoc && String(sectionDoc.classId) !== String(classDoc._id)) {
        throw badRequestError("Section must belong to class");
    }
}
