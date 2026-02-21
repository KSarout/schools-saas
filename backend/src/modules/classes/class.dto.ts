import { z } from "zod";
import type { SchoolClassDocument } from "./class.model";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const classStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createClassSchema = z.object({
    name: z.string().trim().min(2).max(100),
    code: z.string().trim().min(2).max(30),
    level: z.string().trim().min(1).max(40),
    capacity: z.number().int().min(1).optional(),
    academicYearId: z.string().regex(objectIdRegex, "Invalid academicYearId"),
    homeroomTeacherId: z.string().regex(objectIdRegex, "Invalid homeroomTeacherId").optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateClassSchema = z
    .object({
        name: z.string().trim().min(2).max(100).optional(),
        code: z.string().trim().min(2).max(30).optional(),
        level: z.string().trim().min(1).max(40).optional(),
        capacity: z.number().int().min(1).nullable().optional(),
        academicYearId: z.string().regex(objectIdRegex, "Invalid academicYearId").optional(),
        homeroomTeacherId: z.string().regex(objectIdRegex, "Invalid homeroomTeacherId").nullable().optional(),
        isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

export const classListQuerySchema = z.object({
    q: z.string().trim().optional(),
    level: z.string().trim().optional(),
    status: classStatusSchema.optional(),
    academicYearId: z.string().regex(objectIdRegex, "Invalid academicYearId").optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const classIdSchema = z.string().regex(objectIdRegex, "Invalid class id");

export const schoolClassDtoSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    level: z.string(),
    capacity: z.number().int().nullable().optional(),
    isActive: z.boolean(),
    academicYearId: z.string(),
    homeroomTeacherId: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type SchoolClassDto = z.infer<typeof schoolClassDtoSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

export function toClassDto(schoolClass: SchoolClassDocument | (Record<string, any> & { _id: any })): SchoolClassDto {
    const dto = {
        id: typeof schoolClass._id?.toString === "function" ? schoolClass._id.toString() : String(schoolClass._id),
        name: schoolClass.name,
        code: schoolClass.code,
        level: schoolClass.level,
        capacity: schoolClass.capacity ?? null,
        isActive: Boolean(schoolClass.isActive),
        academicYearId:
            typeof schoolClass.academicYearId?.toString === "function"
                ? schoolClass.academicYearId.toString()
                : String(schoolClass.academicYearId),
        homeroomTeacherId:
            schoolClass.homeroomTeacherId == null
                ? null
                : typeof schoolClass.homeroomTeacherId?.toString === "function"
                  ? schoolClass.homeroomTeacherId.toString()
                  : String(schoolClass.homeroomTeacherId),
        createdAt: schoolClass.createdAt ? new Date(schoolClass.createdAt).toISOString() : undefined,
        updatedAt: schoolClass.updatedAt ? new Date(schoolClass.updatedAt).toISOString() : undefined,
    };

    return schoolClassDtoSchema.parse(dto);
}
