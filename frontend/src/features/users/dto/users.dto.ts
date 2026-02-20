import { z } from "zod";
import { listResponseSchema } from "@/lib/schemas/listResponse";

export const UserRoleSchema = z.enum(["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"]);
export const UserStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: UserRoleSchema,
    isActive: z.boolean(),
    mustChangePassword: z.boolean(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export type UserDto = z.infer<typeof UserSchema>;

export const UsersListResponseSchema = listResponseSchema(UserSchema);
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;

export const ListUsersParamsSchema = z.object({
    q: z.string().optional(),
    role: UserRoleSchema.optional(),
    status: UserStatusSchema.optional(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(50),
});
export type ListUsersParams = z.infer<typeof ListUsersParamsSchema>;

export const CreateUserPayloadSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    role: UserRoleSchema,
});
export type CreateUserPayload = z.infer<typeof CreateUserPayloadSchema>;

export const CreateUserResponseSchema = z.object({
    user: UserSchema,
    tempPassword: z.string(),
});
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;

export const UpdateUserPayloadSchema = z.object({
    name: z.string().min(2).optional(),
    role: UserRoleSchema.optional(),
    isActive: z.boolean().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });
export type UpdateUserPayload = z.infer<typeof UpdateUserPayloadSchema>;

export const ResetUserPasswordResponseSchema = z.object({
    userId: z.string(),
    email: z.string().email(),
    tempPassword: z.string(),
});
export type ResetUserPasswordResponse = z.infer<typeof ResetUserPasswordResponseSchema>;

export const OkResponseSchema = z.object({ ok: z.literal(true) });
