import { z } from "zod";
import { listResponseSchema } from "@/lib/schemas/listResponse";

export const ClassSchema = z.object({
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

export type ClassDto = z.infer<typeof ClassSchema>;

export const ClassesListResponseSchema = listResponseSchema(ClassSchema);
export type ClassesListResponse = z.infer<typeof ClassesListResponseSchema>;

export const ListClassesParamsSchema = z.object({
    q: z.string().optional(),
    academicYearId: z.string().optional(),
    isActive: z.boolean().optional(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(50),
});
export type ListClassesParams = z.infer<typeof ListClassesParamsSchema>;

export const CreateClassPayloadSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(1),
    level: z.string().min(1),
    capacity: z.number().int().min(1).optional(),
    academicYearId: z.string().min(1),
    homeroomTeacherId: z.string().optional(),
    isActive: z.boolean().optional(),
});
export type CreateClassPayload = z.infer<typeof CreateClassPayloadSchema>;

export const UpdateClassPayloadSchema = z
    .object({
        name: z.string().min(2).optional(),
        code: z.string().min(1).optional(),
        level: z.string().min(1).optional(),
        capacity: z.number().int().min(1).nullable().optional(),
        academicYearId: z.string().min(1).optional(),
        homeroomTeacherId: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });
export type UpdateClassPayload = z.infer<typeof UpdateClassPayloadSchema>;

export const OkResponseSchema = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponseSchema>;
