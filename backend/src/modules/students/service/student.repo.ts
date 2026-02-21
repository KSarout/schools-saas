import type { Types } from "mongoose";
import {
    tenantCountDocuments,
    tenantCreate,
    tenantFind,
    tenantFindOne,
} from "../../../core/tenantModel";
import { StudentModel, type Student, type StudentStatus } from "../model/student.model";

type TenantId = Types.ObjectId | string;

type StudentCreateInput = {
    studentCode: string;
    studentId: string;
    firstName: string;
    lastName: string;
    gender: Student["gender"];
    dateOfBirth?: Date;
    grade: string;
    section: string;
    academicYearId?: Types.ObjectId | string;
    classId?: Types.ObjectId | string;
    sectionId?: Types.ObjectId | string;
    parentName?: string;
    parentPhone?: string;
    address?: string;
    status: StudentStatus;
};

export function createStudentForTenant(tenantId: TenantId, data: StudentCreateInput) {
    return tenantCreate(StudentModel, data as any, { tenantId });
}

export function listStudentsForTenant(
    tenantId: TenantId,
    filter: Record<string, unknown>
) {
    return tenantFind(StudentModel, filter, { tenantId });
}

export function countStudentsForTenant(
    tenantId: TenantId,
    filter: Record<string, unknown>
) {
    return tenantCountDocuments(StudentModel, filter, { tenantId });
}

export function findStudentByIdForTenant(tenantId: TenantId, studentId: string) {
    return tenantFindOne(
        StudentModel,
        {
            _id: studentId,
        },
        { tenantId }
    );
}

export function findStudentsByStatusForTenant(tenantId: TenantId, status: StudentStatus) {
    return tenantFind(StudentModel, { status }, { tenantId });
}
