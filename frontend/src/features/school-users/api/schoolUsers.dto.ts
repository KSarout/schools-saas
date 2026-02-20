import { z } from "zod";
import { listResponseSchema } from "@/lib/schemas/listResponse";

export const SchoolUserRoleSchema = z.enum(["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"]);
export const SchoolUserStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export type SchoolUserRole = z.infer<typeof SchoolUserRoleSchema>;
export type SchoolUserStatus = z.infer<typeof SchoolUserStatusSchema>;

export const SchoolUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: SchoolUserRoleSchema,
    isActive: z.boolean(),
    mustChangePassword: z.boolean(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type SchoolUserDto = z.infer<typeof SchoolUserSchema>;

export const SchoolUsersListResponseSchema = listResponseSchema(SchoolUserSchema);
export type SchoolUsersListResponse = z.infer<typeof SchoolUsersListResponseSchema>;

export const ListSchoolUsersParamsSchema = z.object({
    q: z.string().optional(),
    role: SchoolUserRoleSchema.optional(),
    status: SchoolUserStatusSchema.optional(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(50),
});
export type ListSchoolUsersParams = z.infer<typeof ListSchoolUsersParamsSchema>;

export const CreateSchoolUserPayloadSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    role: SchoolUserRoleSchema,
});
export type CreateSchoolUserPayload = z.infer<typeof CreateSchoolUserPayloadSchema>;

export const CreateSchoolUserResponseSchema = z.object({
    user: SchoolUserSchema,
    tempPassword: z.string(),
});
export type CreateSchoolUserResponse = z.infer<typeof CreateSchoolUserResponseSchema>;

export const UpdateSchoolUserPayloadSchema = z
    .object({
        name: z.string().min(2).optional(),
        role: SchoolUserRoleSchema.optional(),
        isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });
export type UpdateSchoolUserPayload = z.infer<typeof UpdateSchoolUserPayloadSchema>;

export const ResetSchoolUserPasswordResponseSchema = z.object({
    tempPassword: z.string(),
});
export type ResetSchoolUserPasswordResponse = z.infer<typeof ResetSchoolUserPasswordResponseSchema>;

export const OkResponseSchema = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponseSchema>;
