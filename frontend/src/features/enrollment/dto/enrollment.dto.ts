import { z } from "zod";
import { listResponseSchema } from "@/lib/schemas/listResponse";

export const EnrollmentStatusSchema = z.enum(["ACTIVE", "TRANSFERRED", "PROMOTED", "WITHDRAWN"]);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>;
export const EnrollmentAuditActionSchema = z.enum(["ASSIGN", "TRANSFER", "PROMOTE", "WITHDRAW"]);
export type EnrollmentAuditAction = z.infer<typeof EnrollmentAuditActionSchema>;

const EnrollmentNodeSchema = z.object({
    id: z.string(),
    status: EnrollmentStatusSchema,
    startDate: z.string(),
    endDate: z.string().optional(),
    note: z.string().optional(),
});

const EnrollmentStudentSchema = z.object({
    id: z.string(),
    fullName: z.string(),
    studentCode: z.string(),
});

const NamedNodeSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const EnrollmentListItemSchema = z.object({
    enrollment: EnrollmentNodeSchema,
    student: EnrollmentStudentSchema,
    academicYear: NamedNodeSchema,
    class: NamedNodeSchema,
    section: NamedNodeSchema,
});
export type EnrollmentListItem = z.infer<typeof EnrollmentListItemSchema>;

export const EnrollmentListResponseSchema = listResponseSchema(EnrollmentListItemSchema);
export type EnrollmentListResponse = z.infer<typeof EnrollmentListResponseSchema>;

const EnrollmentAuditPlacementSchema = z.object({
    academicYearId: z.string().optional(),
    classId: z.string().optional(),
    sectionId: z.string().optional(),
});

export const EnrollmentAuditItemSchema = z.object({
    id: z.string(),
    action: EnrollmentAuditActionSchema,
    studentId: z.string(),
    actorUserId: z.string(),
    from: EnrollmentAuditPlacementSchema.optional(),
    to: EnrollmentAuditPlacementSchema.optional(),
    effectiveDate: z.string().optional(),
    note: z.string().optional(),
    createdAt: z.string().optional(),
});
export type EnrollmentAuditItem = z.infer<typeof EnrollmentAuditItemSchema>;

export const EnrollmentAuditListResponseSchema = listResponseSchema(EnrollmentAuditItemSchema);
export type EnrollmentAuditListResponse = z.infer<typeof EnrollmentAuditListResponseSchema>;

export const EnrollmentDtoSchema = z.object({
    id: z.string(),
    studentId: z.string(),
    academicYearId: z.string(),
    classId: z.string(),
    sectionId: z.string(),
    status: EnrollmentStatusSchema,
    startDate: z.string(),
    endDate: z.string().optional(),
    note: z.string().optional(),
    createdBy: z.string(),
    updatedBy: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export type EnrollmentDto = z.infer<typeof EnrollmentDtoSchema>;

export const EnrollmentHistoryItemSchema = z.object({
    id: z.string(),
    status: EnrollmentStatusSchema,
    startDate: z.string(),
    endDate: z.string().optional(),
    note: z.string().optional(),
    academicYear: z.object({
        id: z.string(),
        name: z.string(),
        code: z.string().optional(),
    }),
    class: z.object({
        id: z.string(),
        name: z.string(),
        code: z.string().optional(),
        level: z.string().optional(),
    }),
    section: z.object({
        id: z.string(),
        name: z.string(),
        code: z.string().optional(),
    }),
});

export const EnrollmentHistoryResponseSchema = z.object({
    items: z.array(EnrollmentHistoryItemSchema),
});
export type EnrollmentHistoryResponse = z.infer<typeof EnrollmentHistoryResponseSchema>;

export const ListEnrollmentsParamsSchema = z.object({
    q: z.string().optional(),
    academicYearId: z.string().optional(),
    classId: z.string().optional(),
    sectionId: z.string().optional(),
    status: EnrollmentStatusSchema.optional(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
});
export type ListEnrollmentsParams = z.infer<typeof ListEnrollmentsParamsSchema>;

export const ListEnrollmentAuditParamsSchema = z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    studentId: z.string().optional(),
    action: EnrollmentAuditActionSchema.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
});
export type ListEnrollmentAuditParams = z.infer<typeof ListEnrollmentAuditParamsSchema>;

export const AssignEnrollmentPayloadSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    academicYearId: z.string().min(1, "Academic year is required"),
    classId: z.string().min(1, "Class is required"),
    sectionId: z.string().min(1, "Section is required"),
    startDate: z.string().min(1, "Start date is required"),
    note: z.string().trim().optional(),
});
export type AssignEnrollmentPayload = z.infer<typeof AssignEnrollmentPayloadSchema>;

export const TransferEnrollmentPayloadSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    academicYearId: z.string().min(1, "Academic year is required"),
    toClassId: z.string().min(1, "Class is required"),
    toSectionId: z.string().min(1, "Section is required"),
    effectiveDate: z.string().min(1, "Effective date is required"),
    note: z.string().trim().optional(),
});
export type TransferEnrollmentPayload = z.infer<typeof TransferEnrollmentPayloadSchema>;

export const PromoteEnrollmentPayloadSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    fromAcademicYearId: z.string().min(1, "Current academic year is required"),
    toAcademicYearId: z.string().min(1, "Target academic year is required"),
    toClassId: z.string().min(1, "Target class is required"),
    toSectionId: z.string().min(1, "Target section is required"),
    effectiveDate: z.string().min(1, "Effective date is required"),
    note: z.string().trim().optional(),
});
export type PromoteEnrollmentPayload = z.infer<typeof PromoteEnrollmentPayloadSchema>;

export const WithdrawEnrollmentPayloadSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    academicYearId: z.string().min(1, "Academic year is required"),
    effectiveDate: z.string().min(1, "Effective date is required"),
    note: z.string().trim().optional(),
});
export type WithdrawEnrollmentPayload = z.infer<typeof WithdrawEnrollmentPayloadSchema>;

export const TransitionEnrollmentResponseSchema = z.object({
    previousEnrollment: EnrollmentDtoSchema,
    currentEnrollment: EnrollmentDtoSchema,
});
export type TransitionEnrollmentResponse = z.infer<typeof TransitionEnrollmentResponseSchema>;
