import mongoose from "mongoose";
import { config } from "./config";
import { logger } from "./logger";

export async function connectDB() {
    await mongoose.connect(config.mongoUri);
    logger.info("db.connected");
}

export function isDatabaseReady() {
    return mongoose.connection.readyState === 1;
}
