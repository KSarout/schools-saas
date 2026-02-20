import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { sendError, sendOk } from "../../core/apiResponse";
import { requireSchoolPermission } from "../../middlewares/rbac";
import { schoolAuth } from "../../middlewares/schoolAuth";
import {
    createUserWithTempPassword,
    deactivateUser,
    listUsers,
    resetUserPassword,
    updateUser,
} from "./user.service";
import { logUserAuditAction } from "./service/userAudit.service";
import { countUsersForTenant, findUserById } from "./service/user.repo";

const roleSchema = z.enum(["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const listQuerySchema = z.object({
    q: z.string().optional(),
    role: roleSchema.optional(),
    status: statusSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

const createUserBodySchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    role: roleSchema,
});

const updateUserBodySchema = z
    .object({
        name: z.string().min(2).optional(),
        role: roleSchema.optional(),
        isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

function isValidObjectId(value: string) {
    return Types.ObjectId.isValid(value);
}

async function ensureNotRemovingLastAdmin(params: {
    tenantId: Types.ObjectId;
    targetUserId: string;
    nextRole?: z.infer<typeof roleSchema>;
    nextIsActive?: boolean;
}) {
    const targetUser = await findUserById(params.tenantId, params.targetUserId);
    if (!targetUser) {
        const err = new Error("User not found");
        (err as any).status = 404;
        throw err;
    }

    if (!targetUser.isActive || targetUser.role !== "SCHOOL_ADMIN") return;

    const demotingAdmin =
        params.nextRole !== undefined &&
        params.nextRole !== "SCHOOL_ADMIN";
    const deactivatingAdmin = params.nextIsActive === false;

    if (!demotingAdmin && !deactivatingAdmin) return;

    const activeAdminCount = await countUsersForTenant(params.tenantId, {
        role: "SCHOOL_ADMIN",
        isActive: true,
    });

    if (activeAdminCount <= 1) {
        const err = new Error("Cannot remove last admin");
        (err as any).status = 400;
        throw err;
    }
}

export const userRouter = Router();
userRouter.use(schoolAuth);

export async function listUsersHandler(req: any, res: any) {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, "Invalid query params", parsed.error.issues);

    const { q, role, status, page, limit } = parsed.data;
    const tenantId = req.user!.tenantId;
    const response = await listUsers(tenantId, { q, role, status }, page, limit);

    return res.json(response);
}
userRouter.get("/", requireSchoolPermission("users.list"), listUsersHandler);

export async function createUserHandler(req: any, res: any) {
    const parsed = createUserBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    const tenantId = req.user!.tenantId;
    const actorUserId = req.user!.userId;
    try {
        const result = await createUserWithTempPassword(tenantId, parsed.data);
        await logUserAuditAction({
            tenantId,
            actorUserId,
            action: "USER_CREATED",
            targetUserId: result.user.id,
        });
        return res.status(201).json(result);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
userRouter.post("/", requireSchoolPermission("users.create"), createUserHandler);

export async function updateUserHandler(req: any, res: any) {
    const userId = String(req.params.id);
    if (!isValidObjectId(userId)) return sendError(res, 400, "Invalid user id");

    const parsed = updateUserBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    const tenantId = req.user!.tenantId;
    const actorUserId = req.user!.userId;
    try {
        await ensureNotRemovingLastAdmin({
            tenantId,
            targetUserId: userId,
            nextRole: parsed.data.role,
            nextIsActive: parsed.data.isActive,
        });

        const updated = await updateUser(tenantId, userId, parsed.data);
        await logUserAuditAction({
            tenantId,
            actorUserId,
            action: "USER_UPDATED",
            targetUserId: updated.id,
        });
        return res.json(updated);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
userRouter.patch("/:id", requireSchoolPermission("users.update"), updateUserHandler);

export async function resetUserPasswordHandler(req: any, res: any) {
    const userId = String(req.params.id);
    if (!isValidObjectId(userId)) return sendError(res, 400, "Invalid user id");

    const tenantId = req.user!.tenantId;
    const actorUserId = req.user!.userId;
    try {
        const result = await resetUserPassword(tenantId, userId);
        await logUserAuditAction({
            tenantId,
            actorUserId,
            action: "USER_PASSWORD_RESET",
            targetUserId: userId,
        });
        return res.json(result);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
userRouter.post("/:id/reset-password", requireSchoolPermission("users.resetPassword"), resetUserPasswordHandler);

export async function deleteUserHandler(req: any, res: any) {
    const userId = String(req.params.id);
    if (!isValidObjectId(userId)) return sendError(res, 400, "Invalid user id");

    const tenantId = req.user!.tenantId;
    const actorUserId = req.user!.userId;
    try {
        await ensureNotRemovingLastAdmin({
            tenantId,
            targetUserId: userId,
            nextIsActive: false,
        });

        await deactivateUser(tenantId, userId);
        await logUserAuditAction({
            tenantId,
            actorUserId,
            action: "USER_DEACTIVATED",
            targetUserId: userId,
        });
        return sendOk(res);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
userRouter.delete("/:id", requireSchoolPermission("users.delete"), deleteUserHandler);
