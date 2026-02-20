import type { Request } from "express";
import { config } from "./config";

type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

function shouldLog(level: LogLevel): boolean {
    return levelOrder[level] >= levelOrder[config.logLevel];
}

function baseFields(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
    return {
        level,
        msg,
        timestamp: new Date().toISOString(),
        ...meta,
    };
}

function write(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
    if (!shouldLog(level)) return;
    const line = JSON.stringify(baseFields(level, msg, meta));
    if (level === "error") {
        console.error(line);
        return;
    }
    console.log(line);
}

export const logger = {
    debug(msg: string, meta?: Record<string, unknown>) {
        write("debug", msg, meta);
    },
    info(msg: string, meta?: Record<string, unknown>) {
        write("info", msg, meta);
    },
    warn(msg: string, meta?: Record<string, unknown>) {
        write("warn", msg, meta);
    },
    error(msg: string, meta?: Record<string, unknown>) {
        write("error", msg, meta);
    },
};

export function requestLogMeta(req: Request) {
    return {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        tenantId: req.user?.tenantId,
        userId: req.user?.userId,
        superAdminId: req.superAdmin?.superAdminId,
    };
}
