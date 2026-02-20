import type { Types } from "mongoose";
import {
    tenantCountDocuments,
    tenantCreate,
    tenantFind,
    tenantFindOne,
} from "../../../core/tenantModel";
import { StudentModel, type Student, type StudentStatus } from "../model/student.model";

type TenantId = Types.ObjectId | string;

type StudentCreateInput = Omit<
    Student,
    "tenantId" | "createdAt" | "updatedAt" |
    "firstNameSearch" | "lastNameSearch" |
    "studentCodeSearch" | "studentIdSearch" | "parentPhoneSearch"
>;

export function createStudentForTenant(tenantId: TenantId, data: StudentCreateInput) {
    return tenantCreate(StudentModel, data, { tenantId });
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
