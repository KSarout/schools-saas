import { z } from "zod";
import { listResponseSchema } from "@/lib/schemas/listResponse";

export const SectionSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    classId: z.string(),
    capacity: z.number().int().nullable().optional(),
    isActive: z.boolean(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type SectionDto = z.infer<typeof SectionSchema>;

export const SectionsListResponseSchema = listResponseSchema(SectionSchema);
export type SectionsListResponse = z.infer<typeof SectionsListResponseSchema>;

export const ListSectionsParamsSchema = z.object({
    q: z.string().optional(),
    classId: z.string().optional(),
    isActive: z.boolean().optional(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(50),
});
export type ListSectionsParams = z.infer<typeof ListSectionsParamsSchema>;

export const CreateSectionPayloadSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    classId: z.string().min(1),
    capacity: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
});
export type CreateSectionPayload = z.infer<typeof CreateSectionPayloadSchema>;

export const UpdateSectionPayloadSchema = z
    .object({
        name: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        classId: z.string().min(1).optional(),
        capacity: z.number().int().min(1).nullable().optional(),
        isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });
export type UpdateSectionPayload = z.infer<typeof UpdateSectionPayloadSchema>;

export const OkResponseSchema = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponseSchema>;
