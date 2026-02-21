import type { StudentDocument } from "../model/student.model";

// Works for both mongoose docs and lean objects.
type StudentLike = StudentDocument | (Record<string, any> & { _id: any });

export function toStudentDto(s: StudentLike) {
    const id = typeof s._id?.toString === "function" ? s._id.toString() : String(s._id);

    return {
        id,
        studentCode: s.studentCode,
        studentId: s.studentId,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString() : undefined,
        grade: s.grade,
        section: s.section,
        academicYearId:
            s.academicYearId == null
                ? undefined
                : typeof s.academicYearId?.toString === "function"
                  ? s.academicYearId.toString()
                  : String(s.academicYearId),
        classId:
            s.classId == null
                ? undefined
                : typeof s.classId?.toString === "function"
                  ? s.classId.toString()
                  : String(s.classId),
        sectionId:
            s.sectionId == null
                ? undefined
                : typeof s.sectionId?.toString === "function"
                  ? s.sectionId.toString()
                  : String(s.sectionId),
        parentName: s.parentName ?? undefined,
        parentPhone: s.parentPhone ?? undefined,
        address: s.address ?? undefined,
        status: s.status,
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : undefined,
        updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : undefined,
    };
}
