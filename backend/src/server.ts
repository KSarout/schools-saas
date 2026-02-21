import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { config } from "./core/config";
import { connectDB, isDatabaseReady } from "./core/db";
import { errorHandler } from "./core/errorHandler";
import { logger } from "./core/logger";

import { authRouter } from "./modules/auth/routes/auth.routes";
import { superAdminRouter } from "./modules/super-admin/routes/superAdmin.routes";
import {studentRouter} from "./modules/students/routes/student.routes";
import { userRouter } from "./modules/users/user.routes";
import { requestContext } from "./middlewares/requestContext";
import { academicYearRouter } from "./modules/academic-years/academic-year.routes";
import { classRouter } from "./modules/classes/class.routes";
import { sectionRouter } from "./modules/sections/section.routes";
import { enrollmentRouter } from "./modules/enrollments/enrollment.routes";

const globalLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
});

const authLoginLimiter = rateLimit({
    windowMs: config.authRateLimitWindowMs,
    max: config.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth attempts. Please retry later." },
});

const refreshLimiter = rateLimit({
    windowMs: config.refreshRateLimitWindowMs,
    max: config.refreshRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many token refresh attempts. Please retry later." },
});

function corsOrigin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) {
        callback(null, true);
        return;
    }

    const allowed = config.corsAllowedOrigins;
    if (allowed.includes("*") || allowed.includes(origin)) {
        callback(null, true);
        return;
    }

    callback(new Error("CORS origin not allowed"));
}

async function bootstrap() {
    await connectDB();

    const app = express();
    app.set("trust proxy", config.trustProxy);
    app.disable("x-powered-by");

    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        referrerPolicy: { policy: "no-referrer" },
    }));
    app.use(cors({
        origin: corsOrigin,
        credentials: config.corsAllowCredentials,
    }));
    app.use(requestContext);
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    app.use(globalLimiter);
    app.use("/auth/login", authLoginLimiter);
    app.use("/super-admin/login", authLoginLimiter);
    app.use("/auth/refresh", refreshLimiter);
    app.use("/super-admin/refresh", refreshLimiter);

    app.get("/health", (req, res) => res.json({
        ok: true,
        service: "school-saas-backend",
        uptimeSec: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    }));
    app.get("/ready", (req, res) => {
        if (!isDatabaseReady()) {
            return res.status(503).json({ ok: false, status: "degraded", db: "disconnected" });
        }
        return res.json({ ok: true, status: "ready", db: "connected" });
    });

    app.use("/auth", authRouter);
    app.use("/super-admin", superAdminRouter);
    app.use("/students", studentRouter);
    app.use("/users", userRouter);
    app.use("/academic-years", academicYearRouter);
    app.use("/classes", classRouter);
    app.use("/sections", sectionRouter);
    app.use("/api/school/enrollments", enrollmentRouter);

    app.use(errorHandler);

    app.listen(config.port, () => {
        logger.info("server.started", { port: config.port, env: config.nodeEnv });
    });
}

bootstrap();
