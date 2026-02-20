import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { logger, requestLogMeta } from "../core/logger";

const requestIdHeader = "x-request-id";

export function requestContext(req: Request, res: Response, next: NextFunction) {
    const incoming = req.header(requestIdHeader);
    const requestId = incoming?.trim() || randomUUID();

    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    const start = Date.now();
    res.on("finish", () => {
        logger.info("request.completed", {
            ...requestLogMeta(req),
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
        });
    });

    next();
}
