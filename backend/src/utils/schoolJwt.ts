import jwt from "jsonwebtoken";

export function signSchoolToken(payload: { userId: string; tenantId: string; role: string }) {
    const secret = process.env.JWT_SCHOOL_SECRET;
    if (!secret) throw new Error("Missing JWT_SCHOOL_SECRET");
    return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifySchoolToken(token: string) {
    const secret = process.env.JWT_SCHOOL_SECRET;
    if (!secret) throw new Error("Missing JWT_SCHOOL_SECRET");
    return jwt.verify(token, secret) as {
        userId: string;
        tenantId: string;
        role: string;
        iat: number;
        exp: number;
    };
}
