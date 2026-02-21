import { z } from "zod";
import type { AcademicYearDocument } from "./academic-year.model";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const academicYearStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createAcademicYearSchema = z
    .object({
        name: z.string().trim().min(2).max(100),
        code: z.string().trim().min(2).max(30),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        isActive: z.boolean().optional().default(true),
        isCurrent: z.boolean().optional().default(false),
    })
    .refine((value) => value.endDate > value.startDate, {
        message: "endDate must be after startDate",
        path: ["endDate"],
    });

export const updateAcademicYearSchema = z
    .object({
        name: z.string().trim().min(2).max(100).optional(),
        code: z.string().trim().min(2).max(30).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        isActive: z.boolean().optional(),
        isCurrent: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

export const academicYearListQuerySchema = z.object({
    q: z.string().trim().optional(),
    status: academicYearStatusSchema.optional(),
    current: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const academicYearIdSchema = z.string().regex(objectIdRegex, "Invalid academic year id");

export const academicYearDtoSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    isActive: z.boolean(),
    isCurrent: z.boolean(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type AcademicYearDto = z.infer<typeof academicYearDtoSchema>;
export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;

export function toAcademicYearDto(academicYear: AcademicYearDocument | (Record<string, any> & { _id: any })): AcademicYearDto {
    const dto = {
        id: typeof academicYear._id?.toString === "function" ? academicYear._id.toString() : String(academicYear._id),
        name: academicYear.name,
        code: academicYear.code,
        startDate: new Date(academicYear.startDate).toISOString(),
        endDate: new Date(academicYear.endDate).toISOString(),
        isActive: Boolean(academicYear.isActive),
        isCurrent: Boolean(academicYear.isCurrent),
        createdAt: academicYear.createdAt ? new Date(academicYear.createdAt).toISOString() : undefined,
        updatedAt: academicYear.updatedAt ? new Date(academicYear.updatedAt).toISOString() : undefined,
    };

    return academicYearDtoSchema.parse(dto);
}
