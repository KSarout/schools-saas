import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./core/config";
import { connectDB } from "./core/db";
import { errorHandler } from "./core/errorHandler";

import { authRouter } from "./modules/auth/auth.routes";
import { superAdminRouter } from "./modules/super-admin/superAdmin.routes";
import {studentRouter} from "./modules/students/student.routes";

async function bootstrap() {
    await connectDB();

    const app = express();

    app.use(helmet());
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use(morgan("dev"));

    app.use(
        rateLimit({
            windowMs: 60 * 1000,
            max: 200,
        })
    );

    app.get("/health", (req, res) => res.json({ ok: true }));

    app.use("/auth", authRouter);
    app.use("/super-admin", superAdminRouter);
    app.use("/students", studentRouter);

    app.use(errorHandler);

    app.listen(config.port, () => {
        console.log(`🚀 API running on http://localhost:${config.port}`);
        console.log("✅ SUPER ADMIN ROUTES ENABLED");
    });
}

bootstrap();
