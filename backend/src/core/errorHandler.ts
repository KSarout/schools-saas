import { Request, Response, NextFunction } from "express";
import { sendError } from "./apiResponse";
import { config } from "./config";
import { logger, requestLogMeta } from "./logger";

type AppError = Error & {
    status?: number;
    details?: unknown;
    code?: string;
};

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
    const status = Number.isInteger(err?.status) ? Number(err.status) : 500;
    const isServerError = status >= 500;
    const message = isServerError ? "Internal Server Error" : (err?.message || "Request failed");

    logger.error("request.failed", {
        ...requestLogMeta(req),
        status,
        code: err?.code,
        details: err?.details,
        errorMessage: err?.message,
        stack: config.nodeEnv === "production" ? undefined : err?.stack,
    });

    const details = isServerError
        ? undefined
        : (config.nodeEnv === "production" ? err?.details : (err?.details ?? err?.stack));

    return sendError(res, status, message, details as Record<string, unknown> | undefined);
}
