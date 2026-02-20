import type { UserDocument } from "../model/user.model";

type UserLike = UserDocument | (Record<string, any> & { _id: any });

export function toUserDto(user: UserLike) {
    const id = typeof user._id?.toString === "function" ? user._id.toString() : String(user._id);

    return {
        id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
        updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : undefined,
    };
}
