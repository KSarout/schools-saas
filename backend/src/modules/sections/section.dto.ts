import { z } from "zod";
import type { SectionDocument } from "./section.model";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const sectionStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createSectionSchema = z.object({
    name: z.string().trim().min(1).max(80),
    code: z.string().trim().min(1).max(30),
    classId: z.string().regex(objectIdRegex, "Invalid classId"),
    capacity: z.number().int().min(1).optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateSectionSchema = z
    .object({
        name: z.string().trim().min(1).max(80).optional(),
        code: z.string().trim().min(1).max(30).optional(),
        classId: z.string().regex(objectIdRegex, "Invalid classId").optional(),
        capacity: z.number().int().min(1).nullable().optional(),
        isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

export const sectionListQuerySchema = z.object({
    q: z.string().trim().optional(),
    classId: z.string().regex(objectIdRegex, "Invalid classId").optional(),
    status: sectionStatusSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const sectionIdSchema = z.string().regex(objectIdRegex, "Invalid section id");

export const sectionDtoSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    classId: z.string(),
    capacity: z.number().int().nullable().optional(),
    isActive: z.boolean(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type SectionDto = z.infer<typeof sectionDtoSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

export function toSectionDto(section: SectionDocument | (Record<string, any> & { _id: any })): SectionDto {
    const dto = {
        id: typeof section._id?.toString === "function" ? section._id.toString() : String(section._id),
        name: section.name,
        code: section.code,
        classId: typeof section.classId?.toString === "function" ? section.classId.toString() : String(section.classId),
        capacity: section.capacity ?? null,
        isActive: Boolean(section.isActive),
        createdAt: section.createdAt ? new Date(section.createdAt).toISOString() : undefined,
        updatedAt: section.updatedAt ? new Date(section.updatedAt).toISOString() : undefined,
    };

    return sectionDtoSchema.parse(dto);
}
