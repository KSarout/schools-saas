import type { EnrollmentDocument } from "../model/enrollment.model";

type EnrollmentLike = EnrollmentDocument | (Record<string, any> & { _id: any });

export function toEnrollmentDto(enrollment: EnrollmentLike) {
    const id = typeof enrollment._id?.toString === "function" ? enrollment._id.toString() : String(enrollment._id);

    return {
        id,
        studentId: typeof enrollment.studentId?.toString === "function" ? enrollment.studentId.toString() : String(enrollment.studentId),
        academicYearId:
            typeof enrollment.academicYearId?.toString === "function"
                ? enrollment.academicYearId.toString()
                : String(enrollment.academicYearId),
        classId: typeof enrollment.classId?.toString === "function" ? enrollment.classId.toString() : String(enrollment.classId),
        sectionId: typeof enrollment.sectionId?.toString === "function" ? enrollment.sectionId.toString() : String(enrollment.sectionId),
        status: enrollment.status,
        startDate: new Date(enrollment.startDate).toISOString(),
        endDate: enrollment.endDate ? new Date(enrollment.endDate).toISOString() : undefined,
        note: enrollment.note ?? undefined,
        createdBy: typeof enrollment.createdBy?.toString === "function" ? enrollment.createdBy.toString() : String(enrollment.createdBy),
        updatedBy:
            enrollment.updatedBy == null
                ? undefined
                : typeof enrollment.updatedBy?.toString === "function"
                  ? enrollment.updatedBy.toString()
                  : String(enrollment.updatedBy),
        createdAt: enrollment.createdAt ? new Date(enrollment.createdAt).toISOString() : undefined,
        updatedAt: enrollment.updatedAt ? new Date(enrollment.updatedAt).toISOString() : undefined,
    };
}
