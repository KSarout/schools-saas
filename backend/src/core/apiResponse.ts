import type { Response } from "express";
import type { ZodIssue } from "zod";
import { buildListResponse } from "./listResponse";

type ErrorDetails = Record<string, unknown> | ZodIssue[] | string[] | undefined;

export function sendError(
    res: Response,
    status: number,
    error: string,
    details?: ErrorDetails
) {
    return res.status(status).json({
        error,
        ...(details ? { details } : null),
    });
}

export function sendOk(res: Response, payload: Record<string, unknown> = { ok: true }) {
    return res.json(payload);
}

export function sendList<T>(
    res: Response,
    params: {
        items: T[];
        total: number;
        page: number;
        limit: number;
    }
) {
    return res.json(buildListResponse(params));
}
