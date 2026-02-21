import { z } from "zod";
import { listResponseSchema } from "@/lib/schemas/listResponse";

export const AcademicYearSchema = z.object({
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

export type AcademicYearDto = z.infer<typeof AcademicYearSchema>;

export const AcademicYearsListResponseSchema = listResponseSchema(AcademicYearSchema);
export type AcademicYearsListResponse = z.infer<typeof AcademicYearsListResponseSchema>;

export const ListAcademicYearsParamsSchema = z.object({
    q: z.string().optional(),
    isActive: z.boolean().optional(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(50),
});
export type ListAcademicYearsParams = z.infer<typeof ListAcademicYearsParamsSchema>;

export const CreateAcademicYearPayloadSchema = z
    .object({
        name: z.string().min(2),
        code: z.string().min(2),
        startDate: z.string(),
        endDate: z.string(),
        isActive: z.boolean().optional(),
        isCurrent: z.boolean().optional(),
    })
    .refine((value) => new Date(value.endDate).getTime() > new Date(value.startDate).getTime(), {
        message: "endDate must be after startDate",
        path: ["endDate"],
    });
export type CreateAcademicYearPayload = z.infer<typeof CreateAcademicYearPayloadSchema>;

export const UpdateAcademicYearPayloadSchema = z
    .object({
        name: z.string().min(2).optional(),
        code: z.string().min(2).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isActive: z.boolean().optional(),
        isCurrent: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });
export type UpdateAcademicYearPayload = z.infer<typeof UpdateAcademicYearPayloadSchema>;

export const OkResponseSchema = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponseSchema>;
